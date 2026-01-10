import fs from "node:fs/promises";
import { runGitChecked } from "@/lib/git/cli";
import { ANONYMOUS_OWNER } from "@/lib/constants";
import {
  getRepoRoot,
  listRepos,
  normalizeRepoName,
  normalizeOwner,
  resolveOwnerPath,
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
    const owner = ANONYMOUS_OWNER;
    const normalizedOwner = normalizeOwner(owner);
    const normalized = normalizeRepoName(name);
    const ownerPath = resolveOwnerPath(repoRoot, normalizedOwner);
    const repoPath = resolveRepoPath(repoRoot, normalizedOwner, normalized);

    await fs.mkdir(repoRoot, { recursive: true });
    await fs.mkdir(ownerPath, { recursive: true });
    await fs.mkdir(repoPath, { recursive: true });

    await runGitChecked(["init", "--bare", repoPath]);
    await runGitChecked(["-C", repoPath, "config", "http.receivepack", "true"]);

    return Response.json({ ok: true, owner: normalizedOwner, name: normalized });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create repository";
    return Response.json({ error: message }, { status: 500 });
  }
}
