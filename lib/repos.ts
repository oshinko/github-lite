import fs from "node:fs/promises";
import path from "node:path";
import { getDefaultBranch } from "@/lib/git/browse";

export type RepoSummary = {
  owner: string;
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

export function resolveOwnerPath(repoRoot: string, owner: string) {
  const normalized = normalizeOwner(owner);
  const root = path.resolve(repoRoot);
  const fullPath = path.resolve(repoRoot, normalized);

  if (fullPath !== root && !fullPath.startsWith(root + path.sep)) {
    throw new Error("Invalid repository path");
  }

  return fullPath;
}

export function resolveRepoPath(repoRoot: string, owner: string, name: string) {
  const normalizedOwner = normalizeOwner(owner);
  const normalizedRepo = normalizeRepoName(name);
  const repoDir = `${normalizedRepo}.git`;
  const root = path.resolve(repoRoot);
  const fullPath = path.resolve(repoRoot, normalizedOwner, repoDir);

  if (fullPath !== root && !fullPath.startsWith(root + path.sep)) {
    throw new Error("Invalid repository path");
  }

  return fullPath;
}

export function normalizeRepoName(name: string) {
  return name.trim().replace(/\.git$/i, "");
}

export function normalizeOwner(owner: string) {
  return owner.trim().replace(/^\/+|\/+$/g, "");
}

export function validateRepoName(name: string) {
  const trimmed = normalizeRepoName(name);
  if (!trimmed) return "Repository name is required";
  if (trimmed.length > 100) return "Repository name is too long";
  if (isReservedPath(trimmed)) return "This name is reserved";
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(trimmed)) {
    return "Use only letters, numbers, dot, underscore, or dash";
  }
  if (trimmed.includes("..")) return "Invalid name";
  return null;
}

export function validateOwner(owner: string) {
  const trimmed = normalizeOwner(owner);
  if (!trimmed) return "Owner is required";
  if (trimmed.length > 100) return "Owner is too long";
  if (isReservedPath(trimmed)) return "This owner is reserved";
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(trimmed)) {
    return "Use only letters, numbers, dot, underscore, or dash";
  }
  if (trimmed.includes("..")) return "Invalid owner";
  return null;
}

export async function listRepos(repoRoot: string) {
  const ownerEntries = await fs.readdir(repoRoot, { withFileTypes: true });
  const repos: RepoSummary[] = [];

  for (const ownerEntry of ownerEntries) {
    if (!ownerEntry.isDirectory()) continue;
    const owner = ownerEntry.name;
    if (owner.endsWith(".git")) continue;
    if (validateOwner(owner)) continue;

    const ownerPath = path.join(repoRoot, owner);
    const repoEntries = await fs.readdir(ownerPath, { withFileTypes: true });
    for (const repoEntry of repoEntries) {
      if (!repoEntry.isDirectory()) continue;
      if (!repoEntry.name.endsWith(".git")) continue;

      const name = repoEntry.name.replace(/\.git$/i, "");
      const repoPath = path.join(ownerPath, repoEntry.name);
      let defaultBranch = "main";

      try {
        defaultBranch = await getDefaultBranch(repoPath);
      } catch {
        defaultBranch = "main";
      }

      repos.push({ owner, name, dir: repoPath, defaultBranch });
    }
  }

  repos.sort((a, b) => {
    const ownerCompare = a.owner.localeCompare(b.owner);
    if (ownerCompare !== 0) return ownerCompare;
    return a.name.localeCompare(b.name);
  });
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

function isReservedPath(name: string) {
  const reserved = new Set([
    "_next",
    "api",
    "git",
    "health",
    "repos",
    "favicon.ico",
    "robots.txt",
    "sitemap.xml",
  ]);
  return reserved.has(name.toLowerCase());
}
