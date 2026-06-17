import { Logo, Search, Shield, Github, Terminal, Check } from "@/components/ui/icons";

/** Why it's safe / feature grid. */
const FEATURES = [
  {
    icon: Logo,
    tone: "var(--global)",
    title: "Global vs. project, side by side",
    body:
      "Everything is split by where it lives — your global ~/.claude setup and each repo's own .claude — so you always know what's yours everywhere vs. scoped to one project.",
  },
  {
    icon: Search,
    tone: "var(--info)",
    title: "Real usage counts",
    body:
      "See what's actively used versus what hasn't run in ages. Sort the wheat from the chaff with numbers, not guesswork.",
  },
  {
    icon: Shield,
    tone: "var(--good)",
    title: "Secrets stripped at the source",
    body:
      "API keys, tokens, and env values are redacted before the file is even written — there's nothing sensitive in claude-inventory.json to begin with.",
  },
  {
    icon: Terminal,
    tone: "var(--accent)",
    title: "100% local, nothing uploaded",
    body:
      "The scan runs on your machine and the web app parses the file in your browser. No server, no account, no telemetry. Your setup stays yours.",
  },
  {
    icon: Github,
    tone: "var(--fg-soft)",
    title: "Free & MIT open source",
    body:
      "No paywall, no trial, no catch. The whole thing is open source under MIT — read the code, fork it, or run it yourself.",
  },
  {
    icon: Check,
    tone: "var(--project)",
    title: "Hand the cleanup to Claude",
    body:
      "Prefer to delegate? Export a paste-to-Claude prompt and let Claude Code do the removal for you, step by step.",
  },
];

export function Features() {
  return (
    <section className="section" aria-labelledby="lp-features-title">
      <div className="container">
        <div className="lp-section-head stack center">
          <span className="eyebrow">Why it&rsquo;s safe</span>
          <h2 id="lp-features-title" className="section-title lp-section-title lp-center">
            Built to be useful and trustworthy
          </h2>
          <p className="lead lp-center lp-how-lead">
            A clean look at your setup, without asking you to trust a black box.
          </p>
        </div>

        <div className="lp-feature-grid">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card lp-feature">
                <span className="lp-feature-icon" style={{ color: f.tone }}>
                  <Icon size={20} />
                </span>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="muted lp-feature-body">{f.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
