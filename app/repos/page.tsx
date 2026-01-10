import Link from "next/link";
import NewRepoForm from "@/app/repos/new-repo-form";
import { getRepoRoot, listRepos } from "@/lib/repos";

export const dynamic = "force-dynamic";

export default async function ReposPage() {
  let repos = [];
  let error: string | null = null;

  try {
    repos = await listRepos(getRepoRoot());
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load repositories";
  }

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Repositories</p>
        <h1>Browse</h1>
        <p className="subtitle">Minimal file explorer for bare Git repositories.</p>
      </header>

      <NewRepoForm />

      {error ? (
        <div className="card">
          <p className="error">{error}</p>
        </div>
      ) : null}

      <section className="grid">
        {repos.length === 0 ? (
          <div className="card">
            <p className="muted">No repositories found under GIT_PROJECT_ROOT.</p>
          </div>
        ) : null}

        {repos.map((repo) => (
          <Link
            className="card link-card"
            key={`${repo.owner}/${repo.name}`}
            href={`/${repo.owner}/${repo.name}`}
          >
            <div className="card-title">{repo.name}</div>
            <div className="card-meta">
              {repo.owner} · default: {repo.defaultBranch}
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
