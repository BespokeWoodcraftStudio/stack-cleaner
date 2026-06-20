import type { Metadata } from "next";
import Link from "next/link";
import { ScanCommand } from "@/components/ui/ScanCommand";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Terminal, Shield, Check, Arrow, Upload, Github, Search } from "@/components/ui/icons";
import { SITE_URL, SCAN_NPX } from "@/components/inventory/constants";
import { OsTabs } from "@/components/setup/OsTabs";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbGraph } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Setup: scan your Claude Code install in 2 minutes",
  description:
    "A friendly, step-by-step walkthrough to load your Claude inventory in about two minutes. No coding, no GitHub, 100% local.",
  alternates: { canonical: "/setup" },
  openGraph: {
    title: "Set up the Stack Cleaner in 2 minutes",
    description:
      "A friendly, step-by-step walkthrough to load your Claude inventory in about two minutes. No coding, no GitHub, 100% local.",
    url: "/setup",
  },
};

const GITHUB_URL = "https://github.com/BespokeWoodcraftStudio/stack-cleaner";

/** One step in the vertical stepper. The number badge sits in its own lane so text never collides. */
function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="setup-step">
      <div className="setup-step-num" aria-hidden="true">
        {n}
      </div>
      <div className="setup-step-body">
        <h2 className="setup-step-title">
          <span className="sr-only">Step {n}: </span>
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

export default function Setup() {
  return (
    <div className="container-narrow" style={{ paddingTop: 56, paddingBottom: 24 }}>
      <JsonLd data={breadcrumbGraph("Setup", "/setup")} />
      {/* ---------------- intro ---------------- */}
      <header className="stack gap-4" style={{ marginBottom: 40 }}>
        <span className="eyebrow">
          <Terminal size={14} /> Guided setup
        </span>
        <h1 className="section-title">Load your inventory in about two minutes</h1>
        <p className="lead">
          No coding, no GitHub account, nothing to install beyond Claude Code, which you already
          have. You&apos;ll run one command, then drop the file it makes into this app. That&apos;s
          the whole thing.
        </p>
        <div className="row gap-2 wrap" aria-label="What to expect">
          <span className="badge accent">
            <span className="dot" /> ≈ 2 minutes
          </span>
          <span className="badge global">
            <span className="dot" /> No GitHub needed
          </span>
          <span className="badge project">
            <span className="dot" /> 100% local
          </span>
        </div>
      </header>

      {/* ---------------- the steps ---------------- */}
      <div className="setup-steps">
        {/* Step 1 — terminal */}
        <Step n={1} title="Open your terminal">
          <p className="setup-text">
            The terminal is a plain window where you type a command and press Enter. Think of it as
            a text box for talking to your computer. You won&apos;t need to know anything about it
            beyond opening it. Pick your computer below:
          </p>
          <div style={{ marginTop: 18 }}>
            <OsTabs />
          </div>
        </Step>

        {/* Step 2 — paste the command */}
        <Step n={2} title="How do I run the scan?">
          <p className="setup-text">
            Copy the line below, click into the terminal window, paste it, and press{" "}
            <span className="kbd">Enter</span>. This one command is the same on every computer: Mac,
            Windows, or Linux:
          </p>
          <div style={{ marginTop: 16, marginBottom: 12 }}>
            <CodeBlock code={SCAN_NPX} />
          </div>
          <p className="setup-text muted" style={{ marginTop: 0, marginBottom: 18, fontSize: 13.5 }}>
            It downloads and runs the tool from npm (the standard place Node tools live), with no{" "}
            <code className="inline">curl</code> and nothing piped. The first run may take a few
            seconds to fetch it.
          </p>

          {/* curl alternative, per OS */}
          <details className="setup-details">
            <summary>Prefer not to use npm? Use the per-OS download command</summary>
            <div className="setup-details-body">
              <p className="setup-text">
                This fetches the same script straight from this site. Make sure your computer is
                selected, then copy the line, paste it into the terminal, and press{" "}
                <span className="kbd">Enter</span>.
              </p>
              <div style={{ marginTop: 12 }}>
                <ScanCommand />
              </div>
            </div>
          </details>

          <div className="card card-2" style={{ marginTop: 18, padding: "16px 18px" }}>
            <p className="setup-text" style={{ margin: 0 }}>
              <strong>What it does, plainly:</strong> it looks at your own Claude setup and
              writes a small file called <code className="inline">stack-cleaner.json</code> right
              where the terminal is pointing. It doesn&apos;t change anything on your computer, and
              it doesn&apos;t send anything anywhere.
            </p>
          </div>

          <div
            className="row gap-2"
            style={{ marginTop: 16, color: "var(--fg-soft)", alignItems: "flex-start" }}
          >
            <span style={{ color: "var(--good)", display: "flex", marginTop: 2, flex: "none" }}>
              <Shield size={16} />
            </span>
            <p className="setup-text" style={{ margin: 0 }}>
              Your API keys and tokens are <strong>stripped out</strong> before the file is written;
              they never make it into the file. The script is short, has no dependencies, and you can{" "}
              <a
                href="/scan.mjs"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent-soft)", textDecoration: "underline" }}
              >
                read it first
              </a>{" "}
              if you like.
            </p>
          </div>

          <p className="setup-text muted" style={{ marginTop: 14, fontSize: 13.5 }}>
            This uses Node, which comes with Claude Code. If you ever see{" "}
            <code className="inline">node: command not found</code> (or &ldquo;not recognized&rdquo;
            on Windows), close and reopen the terminal, or install Node from{" "}
            <a href="https://nodejs.org" target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--accent-soft)", textDecoration: "underline" }}>nodejs.org</a>{" "}
            then paste the line again. On older Windows without{" "}
            <code className="inline">curl.exe</code>, swap the first part for{" "}
            <code className="inline">iwr {SITE_URL}/scan.mjs -OutFile stack-cleaner-scan.mjs</code>,
            or just open <a href="/scan.mjs" target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--accent-soft)", textDecoration: "underline" }}>/scan.mjs</a>{" "}
            in your browser, save it, and run <code className="inline">node</code> on the saved file.
          </p>

          {/* cautious two-step alternative */}
          <details className="setup-details">
            <summary>
              Prefer to look before you run it? Use the two-step version
            </summary>
            <div className="setup-details-body">
              <p className="setup-text">
                This saves the script as <code className="inline">stack-cleaner-scan.mjs</code> so
                you can open and read it first, then runs it as a second step. Paste both lines:
              </p>
              <div style={{ marginTop: 12 }}>
                <ScanCommand variant="twoStep" showToggle={false} />
              </div>
              <p className="setup-text faint" style={{ marginTop: 12, marginBottom: 0 }}>
                Running it creates the data file <code className="inline">stack-cleaner.json</code>:
                that&apos;s the one you drop into the app. The result is identical to the one-liner; you
                just get to inspect the script in between.
              </p>
            </div>
          </details>
        </Step>

        {/* Step 3 — find the file */}
        <Step n={3} title="Where is the file saved?">
          <p className="setup-text">
            When the command finishes, the terminal prints a line like{" "}
            <code className="inline">✓ wrote stack-cleaner.json</code> with the exact location.
            The file is named <code className="inline">stack-cleaner.json</code> and it&apos;s
            saved in whatever folder the terminal was pointing at: for a terminal you just opened,
            that&apos;s your home folder (the one with your name on it). On a Mac that&apos;s{" "}
            <code className="inline">/Users/you</code>; on Windows it&apos;s{" "}
            <code className="inline">C:\Users\you</code> (the first entry under Home / Quick access in
            File Explorer). Trust the printed <code className="inline">✓</code> path over guessing.
          </p>
          <div
            className="row gap-2"
            style={{ marginTop: 14, color: "var(--dim)", alignItems: "flex-start" }}
          >
            <span style={{ color: "var(--accent-soft)", display: "flex", marginTop: 2, flex: "none" }}>
              <Check size={16} />
            </span>
            <p className="setup-text" style={{ margin: 0 }}>
              Don&apos;t worry about hunting for it on disk: in the next step you can open your file
              browser to that folder and pick it (on a Mac you can also drag it straight out of the
              terminal).
            </p>
          </div>
        </Step>

        {/* Step 4 — drop it in */}
        <Step n={4} title="How do I open my inventory?">
          <p className="setup-text">
            Open the inventory page, then drag the{" "}
            <code className="inline">stack-cleaner.json</code> file onto it, or click{" "}
            <strong>Choose file</strong> and pick it. From that moment on, everything stays inside
            your browser; nothing is uploaded.
          </p>
          <div className="row gap-3 wrap" style={{ marginTop: 18 }}>
            <Link href="/inventory" className="btn btn-primary btn-lg">
              <Upload size={16} /> Open the inventory
              <Arrow size={16} />
            </Link>
            <span className="muted setup-text" style={{ margin: 0 }}>
              You can come back to this page any time.
            </span>
          </div>
        </Step>
      </div>

      {/* ---------------- what you'll see ---------------- */}
      <section className="card card-pad-lg" style={{ marginTop: 8 }}>
        <span className="eyebrow" style={{ color: "var(--accent-soft)" }}>
          What you&apos;ll see
        </span>
        <h2 style={{ fontSize: 22, marginTop: 12, marginBottom: 16 }}>
          Your whole setup, finally legible
        </h2>
        <ul className="setup-teaser">
          <li>
            <span className="badge global" style={{ flex: "none" }}>
              <span className="dot" /> Global
            </span>
            <span>
              vs{" "}
              <span className="badge project" style={{ verticalAlign: "middle" }}>
                <span className="dot" /> Project
              </span>: every skill, plugin, MCP server, and agent grouped by where it actually lives.
            </span>
          </li>
          <li>
            <span className="badge accent" style={{ flex: "none" }}>
              Usage
            </span>
            <span>Real usage counts, so you can tell what you lean on from what you never touch.</span>
          </li>
          <li>
            <span className="badge good" style={{ flex: "none" }}>
              <span className="dot" /> Cleanup
            </span>
            <span>
              A one-click cleanup plan: tick what you don&apos;t need and get the exact commands to
              remove it.
            </span>
          </li>
        </ul>
      </section>

      {/* ---------------- footer asides ---------------- */}
      <div className="setup-asides">
        <div className="card card-2">
          <div className="row gap-2" style={{ marginBottom: 8 }}>
            <Github size={16} />
            <strong style={{ fontSize: 14 }}>Prefer GitHub?</strong>
          </div>
          <p className="setup-text faint" style={{ margin: 0 }}>
            The scan script and full source live on{" "}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent-soft)", textDecoration: "underline" }}
            >
              GitHub
            </a>
            . Clone the repo and run <code className="inline">node public/scan.mjs</code>, or install
            it once with <code className="inline">npm i -g stack-cleaner</code> and run{" "}
            <code className="inline">stack-cleaner</code>.
          </p>
        </div>

        <div className="card card-2">
          <div className="row gap-2" style={{ marginBottom: 8 }}>
            <Search size={15} />
            <strong style={{ fontSize: 14 }}>Just want to look first?</strong>
          </div>
          <p className="setup-text faint" style={{ margin: 0 }}>
            You don&apos;t have to scan anything to explore. Open the{" "}
            <Link
              href="/inventory"
              style={{ color: "var(--accent-soft)", textDecoration: "underline" }}
            >
              demo inventory
            </Link>{" "}
            and click around with sample data.
          </p>
        </div>
      </div>

      {/* page-scoped styles — uses only design-system variables */}
      <style>{`
        .setup-steps {
          display: flex;
          flex-direction: column;
          gap: 32px;
          margin-bottom: 56px;
        }
        .setup-step {
          display: grid;
          grid-template-columns: 44px 1fr;
          gap: 20px;
          align-items: start;
        }
        .setup-step-num {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 18px;
          font-weight: 680;
          font-variant-numeric: tabular-nums;
          color: var(--accent-ink);
          background: linear-gradient(150deg, var(--accent), #9c441f);
          box-shadow: var(--shadow);
          flex: none;
        }
        .setup-step-body { min-width: 0; }
        .setup-step-title {
          font-size: 20px;
          font-weight: 650;
          margin-bottom: 14px;
          padding-top: 8px;
        }
        .setup-text {
          font-size: 15px;
          line-height: 1.65;
          color: var(--fg-soft);
        }
        .setup-text strong { color: var(--fg); font-weight: 620; }
        .setup-list {
          list-style: none;
          counter-reset: substep;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .setup-list li {
          counter-increment: substep;
          position: relative;
          padding-left: 34px;
          font-size: 15px;
          line-height: 1.6;
          color: var(--fg-soft);
        }
        .setup-list li::before {
          content: counter(substep);
          position: absolute;
          left: 0;
          top: 0;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 12px;
          font-weight: 640;
          font-variant-numeric: tabular-nums;
          color: var(--fg-soft);
          background: var(--panel-2);
          border: 1px solid var(--line-2);
        }
        .setup-details {
          margin-top: 20px;
          border: 1px solid var(--line);
          border-radius: var(--radius-sm);
          background: var(--bg-2);
          overflow: hidden;
        }
        .setup-details > summary {
          cursor: pointer;
          list-style: none;
          padding: 13px 16px;
          font-size: 13.5px;
          font-weight: 540;
          color: var(--dim);
          user-select: none;
          transition: .15s;
        }
        .setup-details > summary::-webkit-details-marker { display: none; }
        .setup-details > summary::before {
          content: "+";
          display: inline-block;
          width: 16px;
          margin-right: 6px;
          font-family: var(--mono);
          color: var(--accent-soft);
          font-weight: 700;
        }
        .setup-details[open] > summary::before { content: "−"; }
        .setup-details > summary:hover { color: var(--fg); background: var(--panel); }
        .setup-details-body {
          padding: 4px 16px 18px;
          border-top: 1px solid var(--line);
        }
        .setup-teaser {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .setup-teaser li {
          display: flex;
          gap: 12px;
          align-items: baseline;
          font-size: 15px;
          line-height: 1.6;
          color: var(--fg-soft);
          flex-wrap: wrap;
        }
        .setup-asides {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 28px;
        }
        @media (max-width: 640px) {
          .setup-step {
            grid-template-columns: 36px 1fr;
            gap: 14px;
          }
          .setup-step-num {
            width: 36px;
            height: 36px;
            font-size: 16px;
          }
          .setup-step-title { font-size: 18px; padding-top: 4px; }
          .setup-asides { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
