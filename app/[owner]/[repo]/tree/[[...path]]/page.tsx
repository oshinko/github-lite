import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepoRoot, repoExists, resolveRepoPath } from "@/lib/repos";
import { getDefaultBranch, hasAnyRef, listTree, readBlob } from "@/lib/git/browse";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { owner: string; repo: string; path?: string[] };
  searchParams: { ref?: string };
};

function joinPath(parts: string[] | undefined) {
  return parts && parts.length > 0 ? parts.join("/") : "";
}

function sortEntries(entries: Awaited<ReturnType<typeof listTree>>) {
  if (!entries) return [];
  return [...entries].sort((a, b) => {
    if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export default async function RepoTreePage({ params, searchParams }: PageProps) {
  const { owner, repo: rawRepo, path: pathSegments } = await params;
  const { ref: refParam } = await searchParams;
  const repo = rawRepo.replace(/\.git$/i, "");

  const repoRoot = getRepoRoot();
  const repoPath = resolveRepoPath(repoRoot, owner, repo);
  if (!(await repoExists(repoPath))) {
    return notFound();
  }
  const defaultBranch = await getDefaultBranch(repoPath);
  const ref = refParam ?? defaultBranch;
  const path = joinPath(pathSegments);

  const tree = await listTree(repoPath, ref, path);
  if (!tree && path) {
    const blob = await readBlob(repoPath, ref, path);
    if (!blob) return notFound();
    return (
      <main className="page">
        <nav className="breadcrumbs">
          <Link href="/repos">Repos</Link>
          <span>/</span>
          <Link href={`/${owner}/${repo}`}>{repo}</Link>
          <span>/</span>
          <span className="crumb">{path}</span>
        </nav>
        <header className="page-header">
          <p className="eyebrow">
            {owner}/{repo}
          </p>
          <h1>{path}</h1>
          <p className="subtitle">ref: {ref}</p>
        </header>
        <section className="card code">
          <pre>{blob}</pre>
        </section>
      </main>
    );
  }

  if (!tree) {
    const hasRefs = await hasAnyRef(repoPath);
    if (!hasRefs) {
      return (
        <main className="page">
        <nav className="breadcrumbs">
          <Link href="/repos">Repos</Link>
          <span>/</span>
          <Link href={`/${owner}/${repo}`}>{repo}</Link>
          </nav>
          <header className="page-header">
            <p className="eyebrow">
              {owner}/{repo}
            </p>
            <h1>Empty repository</h1>
            <p className="subtitle">No commits found yet.</p>
          </header>
          <section className="card">
            <p className="muted">Push your first commit to see files here.</p>
            <pre className="code-block">
              git clone http://localhost:3000/{owner}/{repo}{"\n"}
              cd {repo}{"\n"}
              echo "# {repo}" &gt; README.md{"\n"}
              git add README.md{"\n"}
              git commit -m "Initial commit"{"\n"}
              git push -u origin main
            </pre>
          </section>
        </main>
      );
    }

    return notFound();
  }

  const entries = sortEntries(tree);
  const readme =
    (await readBlob(repoPath, ref, path ? `${path}/README.md` : "README.md")) ??
    (await readBlob(repoPath, ref, path ? `${path}/README` : "README"));

  return (
    <main className="page">
      <nav className="breadcrumbs">
        <Link href="/repos">Repos</Link>
        <span>/</span>
        <Link href={`/${owner}/${repo}`}>{repo}</Link>
        {path ? (
          <>
            <span>/</span>
            <span className="crumb">{path}</span>
          </>
        ) : null}
      </nav>

      <header className="page-header">
        <p className="eyebrow">
          {owner}/{repo}
        </p>
        <h1>{path || "Repository root"}</h1>
        <p className="subtitle">ref: {ref}</p>
      </header>

      <section className="card">
        <ul className="tree">
        {entries.map((entry) => {
            const href = `/${owner}/${repo}/tree/${
              path ? `${path}/` : ""
            }${entry.name}?ref=${encodeURIComponent(ref)}`;
            return (
              <li key={entry.name}>
                <Link href={href}>
                  <span className={`pill ${entry.type}`}>{entry.type}</span>
                  {entry.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {readme ? (
        <section className="card code">
          <h2>README</h2>
          <pre>{readme}</pre>
        </section>
      ) : null}
    </main>
  );
}
