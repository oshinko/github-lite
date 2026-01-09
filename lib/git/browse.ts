import { runGit } from "@/lib/git/cli";

export type TreeEntry = {
  name: string;
  type: "tree" | "blob";
  mode: string;
};

export async function getDefaultBranch(repoPath: string) {
  const result = await runGit(
    ["--git-dir", repoPath, "symbolic-ref", "--short", "HEAD"],
    {}
  );
  if (result.code === 0) {
    const branch = result.stdout.trim();
    if (branch) {
      const headExists = await runGit(
        [
          "--git-dir",
          repoPath,
          "show-ref",
          "--verify",
          "--quiet",
          `refs/heads/${branch}`,
        ],
        {}
      );
      if (headExists.code === 0) return branch;
    }
  }

  const main = await runGit(
    ["--git-dir", repoPath, "show-ref", "--verify", "--quiet", "refs/heads/main"],
    {}
  );
  if (main.code === 0) return "main";

  const master = await runGit(
    [
      "--git-dir",
      repoPath,
      "show-ref",
      "--verify",
      "--quiet",
      "refs/heads/master",
    ],
    {}
  );
  if (master.code === 0) return "master";

  const any = await runGit(
    [
      "--git-dir",
      repoPath,
      "for-each-ref",
      "--format=%(refname:short)",
      "refs/heads",
    ],
    {}
  );
  if (any.code === 0) {
    const first = any.stdout.split("\n").map((line) => line.trim())[0];
    if (first) return first;
  }

  return "main";
}

export async function listTree(
  repoPath: string,
  ref: string,
  path: string
) {
  const treeish = path ? `${ref}:${path}` : ref;
  const result = await runGit(["--git-dir", repoPath, "ls-tree", treeish], {});
  if (result.code !== 0) return null;

  const lines = result.stdout.trim() ? result.stdout.trim().split("\n") : [];
  const entries: TreeEntry[] = lines.map((line) => {
    const [meta, name] = line.split("\t");
    const [mode, type] = meta.split(" ");
    return {
      name,
      type: type === "tree" ? "tree" : "blob",
      mode,
    };
  });

  return entries;
}

export async function hasAnyRef(repoPath: string) {
  const result = await runGit(["--git-dir", repoPath, "show-ref"], {});
  if (result.code !== 0) return false;
  return result.stdout.trim().length > 0;
}

export async function readBlob(
  repoPath: string,
  ref: string,
  path: string
) {
  const result = await runGit(
    ["--git-dir", repoPath, "show", `${ref}:${path}`],
    {}
  );
  if (result.code !== 0) return null;
  return result.stdout;
}
