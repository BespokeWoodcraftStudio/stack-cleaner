import { Terminal, Search, Trash } from "@/components/ui/icons";

/** How it works — 3 numbered steps: Scan → See → Tidy. */
const STEPS = [
  {
    n: "1",
    title: "Scan",
    icon: Terminal,
    tone: "var(--global)",
    body: (
      <>
        One line in your terminal walks every <code className="inline">.claude</code>{" "}
        folder &mdash; global and per-project &mdash; and writes a single{" "}
        <code className="inline">claude-inventory.json</code>. Secrets are stripped
        before anything is written.
      </>
    ),
  },
  {
    n: "2",
    title: "See",
    icon: Search,
    tone: "var(--info)",
    body: (
      <>
        Drop that file into the web app and everything snaps into view &mdash; grouped
        by <strong className="lp-strong-global">global</strong> vs.{" "}
        <strong className="lp-strong-project">project</strong>, with real usage counts
        so you know what&rsquo;s used and what&rsquo;s collecting dust.
      </>
    ),
  },
  {
    n: "3",
    title: "Tidy",
    icon: Trash,
    tone: "var(--accent)",
    body: (
      <>
        Tick the things you want gone and get a ready-to-run cleanup &mdash; a shell
        script, a paste-to-Claude prompt, or plain JSON. Remove the clutter your way,
        in seconds.
      </>
    ),
  },
];

export function HowItWorks() {
  return (
    <section className="section lp-band" aria-labelledby="lp-how-title">
      <div className="container">
        <div className="lp-section-head stack center">
          <span className="eyebrow">How it works</span>
          <h2 id="lp-how-title" className="section-title lp-section-title lp-center">
            Three steps, about two minutes
          </h2>
          <p className="lead lp-center lp-how-lead">
            No account, no upload, no install to babysit. Scan, look, and tidy.
          </p>
        </div>

        <ol className="lp-steps">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.n} className="card card-pad-lg lp-step">
                <div className="row between lp-step-top">
                  <span className="lp-step-num" style={{ color: s.tone }}>{s.n}</span>
                  <span className="lp-step-icon" style={{ color: s.tone }}>
                    <Icon size={20} />
                  </span>
                </div>
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="muted lp-step-body">{s.body}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
