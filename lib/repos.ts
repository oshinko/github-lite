import fs from "node:fs/promises";
import path from "node:path";
import { getDefaultBranch } from "@/lib/git/browse";

export type RepoSummary = {
  name: string;
  dir: string;
  defaultBranch: string;
};

export function getRepoRoot() {
  const root = process.env.GIT_PROJECT_ROOT ?? "";
  if (!root) {
    throw new Error("GIT_PROJECT_ROOT is required");
  }
  return root;
}

export function resolveRepoPath(repoRoot: string, name: string) {
  const normalized = normalizeRepoName(name);
  const repoDir = `${normalized}.git`;
  const root = path.resolve(repoRoot);
  const fullPath = path.resolve(repoRoot, repoDir);

  if (fullPath !== root && !fullPath.startsWith(root + path.sep)) {
    throw new Error("Invalid repository path");
  }

  return fullPath;
}

export function normalizeRepoName(name: string) {
  return name.trim().replace(/\.git$/i, "");
}

export function validateRepoName(name: string) {
  const trimmed = normalizeRepoName(name);
  if (!trimmed) return "Repository name is required";
  if (trimmed.length > 100) return "Repository name is too long";
  const reserved = new Set([
    "_next",
    "api",
    "health",
    "repos",
    "__git",
    "favicon.ico",
    "robots.txt",
    "sitemap.xml",
  ]);
  if (reserved.has(trimmed.toLowerCase())) return "This name is reserved";
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(trimmed)) {
    return "Use only letters, numbers, dot, underscore, or dash";
  }
  if (trimmed.includes("..")) return "Invalid name";
  return null;
}

export async function listRepos(repoRoot: string) {
  const entries = await fs.readdir(repoRoot, { withFileTypes: true });
  const repos: RepoSummary[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!entry.name.endsWith(".git")) continue;

    const name = entry.name.replace(/\.git$/i, "");
    const repoPath = path.join(repoRoot, entry.name);
    let defaultBranch = "main";

    try {
      defaultBranch = await getDefaultBranch(repoPath);
    } catch {
      defaultBranch = "main";
    }

    repos.push({ name, dir: repoPath, defaultBranch });
  }

  repos.sort((a, b) => a.name.localeCompare(b.name));
  return repos;
}

export async function repoExists(repoPath: string) {
  try {
    const stat = await fs.stat(repoPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}
