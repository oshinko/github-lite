import { spawn } from "node:child_process";
import { PassThrough, Readable } from "node:stream";
import type { ReadableStream } from "node:stream/web";

type BackendResult = {
  status: number;
  headers: Headers;
  body: ReadableStream<Uint8Array>;
};

function parseHeaders(raw: string) {
  const headers = new Headers();
  let status = 200;

  for (const line of raw.split("\r\n")) {
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key.toLowerCase() === "status") {
      const code = Number(value.split(" ")[0]);
      if (!Number.isNaN(code)) status = code;
      continue;
    }
    headers.append(key, value);
  }

  return { status, headers };
}

function buildEnv(request: Request, pathInfo: string, repoRoot: string) {
  const url = new URL(request.url);
  const contentType = request.headers.get("content-type") ?? "";
  const contentLength = request.headers.get("content-length") ?? "";
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const remoteAddr = forwardedFor.split(",")[0]?.trim() ?? "";

  return {
    ...process.env,
    GIT_PROJECT_ROOT: repoRoot,
    GIT_HTTP_EXPORT_ALL: process.env.GIT_HTTP_EXPORT_ALL ?? "1",
    REQUEST_METHOD: request.method,
    PATH_INFO: pathInfo,
    QUERY_STRING: url.search.startsWith("?") ? url.search.slice(1) : "",
    CONTENT_TYPE: contentType,
    CONTENT_LENGTH: contentLength,
    REMOTE_ADDR: remoteAddr,
  };
}

export async function runGitHttpBackend(
  request: Request,
  pathInfo: string,
  repoRoot: string
): Promise<BackendResult> {
  if (!repoRoot) {
    throw new Error("GIT_PROJECT_ROOT is required");
  }

  const child = spawn("git", ["http-backend"], {
    env: buildEnv(request, pathInfo, repoRoot),
    stdio: ["pipe", "pipe", "pipe"],
  });

  const stderrChunks: Buffer[] = [];
  child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

  const bodyStream = new PassThrough();
  let headerBuffer = Buffer.alloc(0);
  let headersParsed = false;
  let resultHeaders = new Headers();
  let resultStatus = 200;

  const headersReady = new Promise<void>((resolve, reject) => {
    child.stdout.on("data", (chunk: Buffer) => {
      if (headersParsed) {
        bodyStream.write(chunk);
        return;
      }

      headerBuffer = Buffer.concat([headerBuffer, chunk]);
      const marker = headerBuffer.indexOf("\r\n\r\n");
      if (marker === -1) return;

      const headerPart = headerBuffer.slice(0, marker).toString("utf8");
      const rest = headerBuffer.slice(marker + 4);
      const parsed = parseHeaders(headerPart);
      resultHeaders = parsed.headers;
      resultStatus = parsed.status;
      headersParsed = true;
      if (rest.length > 0) bodyStream.write(rest);
      resolve();
    });

    child.stdout.on("end", () => {
      bodyStream.end();
      if (!headersParsed) {
        const err = Buffer.concat(stderrChunks).toString("utf8");
        reject(new Error(err || "git http-backend produced no headers"));
      }
    });

    child.stdout.on("error", reject);
  });

  const requestBody = request.body
    ? Readable.fromWeb(request.body as ReadableStream<Uint8Array>)
    : null;
  if (requestBody) {
    requestBody.pipe(child.stdin);
  } else {
    child.stdin.end();
  }

  await headersReady;
  const webBody = Readable.toWeb(bodyStream) as ReadableStream<Uint8Array>;

  return {
    status: resultStatus,
    headers: resultHeaders,
    body: webBody,
  };
}
