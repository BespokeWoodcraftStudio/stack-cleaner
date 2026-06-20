import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Arrow, Upload, Github } from "@/components/ui/icons";
import { JsonLd } from "@/components/JsonLd";
import { faqGraph, breadcrumbGraph } from "@/lib/seo";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to the common questions about the Stack Cleaner: what's uploaded (nothing), whether secrets are safe, what it can change (nothing), Windows support, and more.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Stack Cleaner: FAQ",
    description:
      "Is anything uploaded? Are my keys safe? Can it delete things? Plain answers to the questions people ask most.",
    url: "/faq",
  },
};

const REPO = "https://github.com/BespokeWoodcraftStudio/stack-cleaner";
const SECURITY = `${REPO}/blob/main/SECURITY.md`;
const SUPPORT = `${REPO}/blob/main/SUPPORT.md`;

const docLink = { color: "var(--accent-soft)", textDecoration: "underline" } as const;

/** One Q&A accordion. All items render open by default so every answer is in the
 *  initial SSR HTML (crawler/AI friendly); they stay user-collapsible. */
function Item({ q, defaultOpen = true, children }: { q: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <details className="faq-item" {...(defaultOpen ? { open: true } : {})}>
      <summary>{q}</summary>
      <div className="faq-answer">{children}</div>
    </details>
  );
}

export default function Faq() {
  return (
    <div className="container-narrow" style={{ paddingTop: 56, paddingBottom: 40 }}>
      <JsonLd data={faqGraph} />
      <JsonLd data={breadcrumbGraph("FAQ", "/faq")} />
      <header className="stack gap-4" style={{ marginBottom: 36 }}>
        <span className="eyebrow"><Shield size={14} /> Good to know</span>
        <h1 className="section-title">Frequently asked questions</h1>
        <p className="lead">
          The short version: the scan runs on your machine, nothing is uploaded, and the tool never
          deletes anything for you. The details are below.
        </p>
      </header>

      <div className="stack gap-2">
        <Item q="Is anything uploaded?">
          <p>
            No. The scan runs on your machine and never makes a network request. The web app parses
            your <code className="inline">stack-cleaner.json</code> in the browser and keeps it only
            in that browser&apos;s <code className="inline">localStorage</code>. There is no server to
            upload to.
          </p>
        </Item>

        <Item q="Can it delete or change anything on my computer?">
          <p>
            No. The scan only reads. The cleanup features only <strong>generate text</strong> (a
            paste-to-Claude prompt, a shell script, or JSON) that you review and run yourself. The
            tool never touches your files.
          </p>
        </Item>

        <Item q="Are my API keys and secrets safe?">
          <p>
            Known secret-bearing fields are redacted before the file is written: MCP{" "}
            <code className="inline">env</code> values, auth headers, URL credentials and query
            strings, and token-looking command arguments all become{" "}
            <code className="inline">&lt;redacted&gt;</code>. Your home directory is rewritten to{" "}
            <code className="inline">~</code> so your username never leaks.
          </p>
          <p style={{ marginTop: 10 }}>
            One caveat: skill and agent descriptions are prose copied from frontmatter. We run a
            best-effort scrub over them, but it isn&apos;t a guarantee. Don&apos;t keep secrets in a{" "}
            <code className="inline">SKILL.md</code> description. If you ever spot an unredacted
            secret, see{" "}
            <a href={SECURITY} target="_blank" rel="noopener noreferrer" style={docLink}>SECURITY.md</a>:{" "}
            rotate the credential first, then report it privately.
          </p>
        </Item>

        <Item q="Do I need a GitHub account or to know the terminal?">
          <p>
            No. The <Link href="/setup" style={docLink}>setup wizard</Link> is copy-paste: you copy
            one line, paste it into your terminal, press Enter, and drop the resulting file into the
            tool. No GitHub account, no coding.
          </p>
        </Item>

        <Item q="How does it know what I actually use?">
          <p>
            The scan reads your local Claude Code transcripts (the session logs in{" "}
            <code className="inline">~/.claude/projects</code>) and counts how many times each skill,
            agent, and MCP server was actually invoked, plus when it was last used. That&apos;s how
            the tool can show &ldquo;installed but never used,&rdquo; even for MCP servers and agents,
            which carry no usage count in plain config.
          </p>
          <p style={{ marginTop: 10 }}>
            It reads <strong>only the tool, skill, agent, and MCP-server names, the counts, and the
            timestamps</strong>: never your prompts, message text, arguments, file paths, or command
            contents. It all stays on your machine until you choose to upload the file. To skip the
            transcript read entirely, run the scan with <code className="inline">--no-transcripts</code>.
          </p>
        </Item>

        <Item q="Does this work on Windows?">
          <p>
            Yes. The <Link href="/setup" style={docLink}>setup page</Link> gives you a
            Windows-specific (PowerShell-safe) command to copy. The scanner is plain Node and runs the
            same on Windows, macOS, and Linux.
          </p>
        </Item>

        <Item q="I don't trust “curl | node”. What else can I do?">
          <p>That&apos;s a healthy instinct. You have options, lightest-touch first:</p>
          <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
            <li>
              Run <code className="inline">npx stack-cleaner@latest</code> instead. No pipe, no{" "}
              <code className="inline">curl</code>: npm fetches the published, versioned package and
              runs it. It&apos;s the same code as <code className="inline">/scan.mjs</code>, just
              delivered through npm.
            </li>
            <li>
              Open <a href="/scan.mjs" target="_blank" rel="noopener noreferrer" style={docLink}>/scan.mjs</a>,
              read it (one short, dependency-free file), save it, then run <code className="inline">node</code> on the saved file.
            </li>
            <li>Clone the repo and run <code className="inline">node public/scan.mjs</code> from source.</li>
          </ul>
          <p style={{ marginTop: 10 }}>Either way you run the exact same code, just after you&apos;ve looked at it.</p>
        </Item>

        <Item q="Where is the file saved?">
          <p>
            In the folder your terminal was in when you ran the scan. The scanner prints the exact
            path with a <code className="inline">✓</code> when it finishes. Trust that line. For a
            terminal you just opened, it&apos;s usually your home folder.
          </p>
        </Item>

        <Item q="Is this affiliated with Anthropic?">
          <p>
            No. It&apos;s a{" "}
            <a href="https://github.com/BespokeWoodcraftStudio" target="_blank" rel="noopener noreferrer" style={docLink}>Bespoke Woodcraft Studio</a>{" "}
            tool, not an Anthropic product. &ldquo;Claude&rdquo; and &ldquo;Claude Code&rdquo; are trademarks of Anthropic.
          </p>
        </Item>

        <Item q="Is it really free and open source?">
          <p>
            Yes: free and open source under the MIT license. The full source is on{" "}
            <a href={REPO} target="_blank" rel="noopener noreferrer" style={docLink}>GitHub</a>: read
            it, run it, fork it, or self-host your own copy.
          </p>
        </Item>
      </div>

      <div className="card card-2" style={{ marginTop: 32 }}>
        <div className="row between wrap gap-3">
          <div className="stack gap-1">
            <strong style={{ fontSize: 15 }}>Still have a question?</strong>
            <span className="muted" style={{ fontSize: 14 }}>
              See <a href={SUPPORT} target="_blank" rel="noopener noreferrer" style={docLink}>SUPPORT.md</a>{" "}
              for where to ask, or open the tool and try it with demo data.
            </span>
          </div>
          <div className="row gap-2 wrap">
            <Link href="/setup" className="btn btn-secondary btn-sm">Set it up <Arrow size={14} /></Link>
            <Link href="/inventory" className="btn btn-primary btn-sm"><Upload size={14} /> Open the tool</Link>
          </div>
        </div>
      </div>

      <div className="row gap-2 faint" style={{ marginTop: 18, fontSize: 13 }}>
        <Github size={14} />
        <span>
          Prefer the docs? The full{" "}
          <a href={`${REPO}/blob/main/docs/FAQ.md`} target="_blank" rel="noopener noreferrer" style={docLink}>FAQ</a>,{" "}
          <a href={`${REPO}/blob/main/docs/USAGE.md`} target="_blank" rel="noopener noreferrer" style={docLink}>usage guide</a>, and{" "}
          <a href={SECURITY} target="_blank" rel="noopener noreferrer" style={docLink}>security policy</a> live on GitHub.
        </span>
      </div>

      {/* page-scoped styles — design-system variables only */}
      <style>{`
        .faq-item {
          border: 1px solid var(--line);
          border-radius: var(--radius-sm);
          background: var(--panel);
          overflow: hidden;
        }
        .faq-item > summary {
          cursor: pointer;
          list-style: none;
          padding: 16px 18px;
          font-size: 15.5px;
          font-weight: 600;
          color: var(--fg);
          user-select: none;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: background .15s;
        }
        .faq-item > summary::-webkit-details-marker { display: none; }
        .faq-item > summary::before {
          content: "+";
          font-family: var(--mono);
          color: var(--accent-soft);
          font-weight: 700;
          width: 14px;
          flex: none;
        }
        .faq-item[open] > summary::before { content: "\\2212"; }
        .faq-item > summary:hover { background: var(--panel-2); }
        .faq-answer {
          padding: 2px 18px 18px 42px;
          color: var(--fg-soft);
          font-size: 14.5px;
          line-height: 1.65;
        }
        .faq-answer code.inline { font-size: 0.86em; }
        @media (max-width: 480px) {
          .faq-answer { padding-left: 18px; }
        }
      `}</style>
    </div>
  );
}
