import { runGitHttpBackend } from "@/lib/git/http-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildPathInfo(
  owner: string,
  repo: string,
  pathSegments: string[] | undefined
) {
  const rest =
    pathSegments && pathSegments.length > 0 ? `/${pathSegments.join("/")}` : "";
  return `/${owner}/${repo}.git${rest}`;
}

async function handle(
  request: Request,
  params: Promise<{ owner: string; repo: string; path?: string[] }>
) {
  const { owner, repo: rawRepo, path } = await params;
  const repo = rawRepo.replace(/\.git$/i, "");

  const repoRoot = process.env.GIT_PROJECT_ROOT ?? "";
  if (!repoRoot) {
    return new Response("GIT_PROJECT_ROOT is required", { status: 500 });
  }

  const pathInfo = buildPathInfo(owner, repo, path);
  const result = await runGitHttpBackend(request, pathInfo, repoRoot);

  return new Response(result.body, {
    status: result.status,
    headers: result.headers,
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ owner: string; repo: string; path?: string[] }> }
) {
  return handle(request, context.params);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ owner: string; repo: string; path?: string[] }> }
) {
  return handle(request, context.params);
}
