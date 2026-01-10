import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isGitSmartHttpRequest(
  req: NextRequest,
  owner: string,
  repo: string,
  rest: string[]
) {
  if (!owner || !repo || rest.length === 0) return false;

  const first = rest[0] ?? "";
  const second = rest[1] ?? "";

  if (first === "info" && second === "refs") {
    const service = req.nextUrl.searchParams.get("service");
    return service === "git-upload-pack" || service === "git-receive-pack";
  }

  if (first === "git-upload-pack" || first === "git-receive-pack") {
    return req.method === "POST";
  }

  if (first === "objects" || first === "HEAD") return true;

  return false;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return NextResponse.next();

  const owner = parts[0] ?? "";
  const rawRepo = parts[1] ?? "";
  const repo = rawRepo.replace(/\.git$/i, "");

  if (!owner || !repo) return NextResponse.next();

  const rest = parts.slice(2);
  if (!isGitSmartHttpRequest(request, owner, repo, rest)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/git/${owner}/${repo}/${rest.join("/")}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next|api|git|health|repos).*)"],
};
