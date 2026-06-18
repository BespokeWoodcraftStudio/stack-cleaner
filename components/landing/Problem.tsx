/**
 * The problem — short, scannable. Claude installs pile up across global +
 * every project, and you lose track of what you have, use, and what's just noise.
 */
export function Problem() {
  return (
    <section className="section" aria-labelledby="lp-problem-title">
      <div className="container-narrow">
        <span className="eyebrow">The problem</span>
        <h2 id="lp-problem-title" className="section-title lp-section-title">
          Your Claude setup grows faster than you can keep track of it
        </h2>
        <p className="lead lp-problem-lead">
          Every install adds up &mdash; a skill here, a plugin there, an MCP server you
          tried once, an agent you copied from a tutorial. They spread across your{" "}
          <strong className="lp-strong-global">global</strong> config and{" "}
          <strong className="lp-strong-project">every project</strong> you&rsquo;ve touched.
          Months later you can&rsquo;t answer three simple questions:
        </p>

        <div className="lp-problem-grid">
          <div className="card lp-problem-card">
            <span className="lp-q">&ldquo;What&rsquo;s even installed?&rdquo;</span>
            <p className="muted lp-problem-card-body">
              Skills, plugins, MCP servers, and agents are scattered across global and
              project folders. There&rsquo;s no single place to see them all.
            </p>
          </div>
          <div className="card lp-problem-card">
            <span className="lp-q">&ldquo;Do I actually use this?&rdquo;</span>
            <p className="muted lp-problem-card-body">
              Half of it is from a tutorial you followed once. Without usage counts,
              you can&rsquo;t tell what&rsquo;s earning its keep from what&rsquo;s dead weight.
            </p>
          </div>
          <div className="card lp-problem-card">
            <span className="lp-q">&ldquo;What&rsquo;s just noise?&rdquo;</span>
            <p className="muted lp-problem-card-body">
              Duplicates, abandoned experiments, and overlapping tools quietly bloat
              your context and clutter every prompt &mdash; and you forget they exist.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
