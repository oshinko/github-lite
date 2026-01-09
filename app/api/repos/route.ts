import fs from "node:fs/promises";
import { runGitChecked } from "@/lib/git/cli";
import {
  getRepoRoot,
  listRepos,
  normalizeRepoName,
  resolveRepoPath,
  validateRepoName,
} from "@/lib/repos";

export const runtime = "nodejs";

export async function GET() {
  try {
    const repos = await listRepos(getRepoRoot());
    return Response.json({ repos });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list repos";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name : "";
    const validation = validateRepoName(name);
    if (validation) {
      return Response.json({ error: validation }, { status: 400 });
    }

    const repoRoot = getRepoRoot();
    const normalized = normalizeRepoName(name);
    const repoPath = resolveRepoPath(repoRoot, normalized);

    await fs.mkdir(repoRoot, { recursive: true });
    await fs.mkdir(repoPath, { recursive: true });

    await runGitChecked(["init", "--bare", repoPath]);
    await runGitChecked(["-C", repoPath, "config", "http.receivepack", "true"]);

    return Response.json({ ok: true, name: normalized });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create repository";
    return Response.json({ error: message }, { status: 500 });
  }
}
