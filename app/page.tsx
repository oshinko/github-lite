export default function HomePage() {
  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">GitHub Lite</p>
        <h1>Minimal Git hosting and browsing</h1>
        <p className="subtitle">
          App Router only. Smart HTTP via git http-backend.
        </p>
      </header>

      <section className="grid">
        <a className="card link-card" href="/repos">
          <div className="card-title">Browse repositories</div>
          <div className="card-meta">/repos</div>
        </a>
      </section>
    </main>
  );
}
