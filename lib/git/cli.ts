import { spawn } from "node:child_process";

type GitResult = {
  stdout: string;
  stderr: string;
  code: number | null;
};

type GitOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
};

export function runGit(args: string[], options: GitOptions = {}) {
  return new Promise<GitResult>((resolve, reject) => {
    const child = spawn("git", args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", reject);
    child.on("close", (code) => resolve({ stdout, stderr, code }));
  });
}

export async function runGitChecked(args: string[], options: GitOptions = {}) {
  const result = await runGit(args, options);
  if (result.code !== 0) {
    const message = result.stderr.trim() || result.stdout.trim() || "git failed";
    throw new Error(message);
  }
  return result.stdout;
}
