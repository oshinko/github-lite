import { notFound, redirect } from "next/navigation";
import { getRepoRoot, repoExists, resolveRepoPath } from "@/lib/repos";
import { getDefaultBranch } from "@/lib/git/browse";

export const dynamic = "force-dynamic";

export default async function RepoRootPage({
  params,
}: {
  params: { owner: string; repo: string };
}) {
  const { owner, repo: rawRepo } = await params;
  const repo = rawRepo.replace(/\.git$/i, "");

  const repoRoot = getRepoRoot();
  const repoPath = resolveRepoPath(repoRoot, owner, repo);
  if (!(await repoExists(repoPath))) {
    return notFound();
  }

  const defaultBranch = await getDefaultBranch(repoPath);
  redirect(`/${owner}/${repo}/tree?ref=${encodeURIComponent(defaultBranch)}`);
}
