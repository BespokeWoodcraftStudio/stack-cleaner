import type { Metadata } from "next";
import Link from "next/link";
import { Arrow, Upload } from "@/components/ui/icons";
import { JsonLd } from "@/components/JsonLd";
import { articleGraph } from "@/lib/seo";

const PATH = "/guide/clean-up-claude-code";
const HEADLINE =
  "How to clean up your Claude Code setup (skills, plugins, MCP servers, and agents)";
const DESCRIPTION =
  "Clean up your Claude Code setup: audit your skills, plugins, MCP servers, and agents, find the duplicates plugins bundle, and remove what you never use.";

export const metadata: Metadata = {
  title: "How to Clean Up Your Claude Code Setup (Skills, Plugins, MCP)",
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    title: "How to clean up your Claude Code setup",
    description:
      "Audit your Claude Code skills, plugins, MCP servers, and agents, find the duplicates plugins quietly bundle, and clear out what you never use. A practical, privacy-first guide.",
    url: PATH,
    type: "article",
  },
};

export default function CleanUpClaudeCodeGuide() {
  return (
    <div className="container-narrow guide" style={{ paddingTop: 56, paddingBottom: 56 }}>
      <JsonLd
        data={articleGraph({
          headline: HEADLINE,
          description: DESCRIPTION,
          path: PATH,
          breadcrumbName: "Clean up your Claude Code setup",
        })}
      />

      <nav className="guide-crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Guide</span>
      </nav>

      <header className="stack gap-4" style={{ marginBottom: 8 }}>
        <h1 className="section-title">
          How to clean up your Claude Code setup
        </h1>
        <p className="lead">
          Skills, plugins, MCP servers, and agents pile up fast. After a few months of installing
          things, your Claude Code setup carries copies you never chose, capabilities you never use,
          and quiet duplicates that plugins bundle on your behalf. This guide walks through how that
          clutter accumulates, what it actually costs you, and the fastest way to get an honest,
          scope-aware picture so you can clear it out with confidence.
        </p>
      </header>

      <article className="guide-body">
        <h2>Why does a Claude Code setup get cluttered?</h2>
        <p>
          Clutter is the natural result of how Claude Code is extended. Skills, plugins, MCP servers,
          and agents each get added independently, often weeks apart, and almost nothing prompts you
          to remove the old ones. Worse, the same capability can live in two different scopes:{" "}
          <strong>global</strong>, under <code className="inline">~/.claude</code>, where it applies
          everywhere, and <strong>project</strong>, under a repository&apos;s{" "}
          <code className="inline">.claude</code> folder, where it applies only there. The same skill
          can exist in both, and from the inside it is hard to tell which copy is doing the work.
        </p>
        <p>
          The biggest source of hidden clutter is plugins. A plugin is not a single feature: it can
          bundle its own skills, agents, and MCP servers. Install one plugin and you may quietly gain
          half a dozen capabilities you never picked individually. If you also installed a standalone
          skill that a plugin later bundled, you now have two copies of the same thing, and you never
          made a decision to keep either one. That is how a setup that felt deliberate ends up full of
          things you cannot account for.
        </p>

        <h2>What does clutter actually cost you?</h2>
        <p>
          The cost is not just visual mess. It is context. Many of these definitions can load into the
          model&apos;s working context, and that space is finite. Each MCP server advertises its tool
          schemas so Claude knows what it can call. Each skill carries a description that tells the
          model when to use it. Each agent carries its own definition. When you keep duplicates, or
          keep things you never use, those descriptions and schemas still take up room and add noise
          that the model has to read past.
        </p>
        <p>
          The practical effects are real even if they are hard to put a single number on: redundant
          copies waste tokens, near-identical skills make it harder for the model to pick the right
          one, and an MCP server you forgot you installed keeps advertising tools you will never call.
          The fix is not to strip your setup bare. It is to keep what you genuinely use and remove the
          rest, so every definition that loads is one you would choose again.
        </p>

        <h2>How do I audit my Claude Code setup manually?</h2>
        <p>You can do a thorough pass by hand. The places to look:</p>
        <ul>
          <li>
            <strong>Global skills.</strong> Open <code className="inline">~/.claude/skills</code> and
            read what is there. Each skill folder has a <code className="inline">SKILL.md</code> with a
            description. Ask yourself, honestly, when you last used it.
          </li>
          <li>
            <strong>Global plugins.</strong> Look in <code className="inline">~/.claude/plugins</code>.
            For each plugin, check what it bundles, because the skills and agents inside it count too.
          </li>
          <li>
            <strong>Agents.</strong> Check <code className="inline">~/.claude/agents</code> for
            subagent definitions you may have added once and forgotten.
          </li>
          <li>
            <strong>MCP servers.</strong> These live in your Claude settings (and per-project config).
            Each one advertises a set of tools; list them and note which you actually call.
          </li>
          <li>
            <strong>Per-project setups.</strong> In each repository you work in, open its{" "}
            <code className="inline">.claude</code> folder and repeat the pass. Project scope is easy
            to forget precisely because it is out of sight in another directory.
          </li>
        </ul>
        <p>
          As you go, watch for the same capability showing up more than once, especially when one copy
          is standalone and another is bundled inside a plugin. That overlap is the single most common
          thing a manual audit misses, because the two copies live in different folders and never sit
          next to each other where you would notice.
        </p>

        <h2>How do I find duplicate skills and plugins?</h2>
        <p>
          Duplicate detection is the part that is genuinely hard to do by eye. Because plugins bundle
          their own skills, agents, and MCP servers, a standalone skill you installed deliberately can
          be superseded by an identical copy that arrived inside a plugin. You would only catch it by
          opening every plugin, reading what it ships, and cross-referencing that against your
          standalone installs across both global and project scope. Almost nobody does that by hand.
        </p>
        <p>
          This is exactly what{" "}
          <Link href="/inventory">Stack Cleaner&apos;s duplicate detection</Link> surfaces for you. It
          reads your whole setup, lays the standalone items next to the ones plugins bundle, and flags
          the overlaps in plain language, with provenance, so you can see which copy came from where
          and decide which one to keep. Instead of guessing, you get a list of the actual collisions
          and the context to act on them.
        </p>

        <h2>What is the fastest way to clean it up?</h2>
        <p>
          The fastest path is to stop reading folders by hand and let a scan do the inventory for you.
          The flow is short:
        </p>
        <ul>
          <li>
            <strong>Run the scan.</strong> One command,{" "}
            <code className="inline">npx stack-cleaner@latest</code> (or the{" "}
            <code className="inline">curl</code> one-liner from the{" "}
            <Link href="/setup">setup guide</Link>), reads your local Claude Code setup and writes a
            small <code className="inline">stack-cleaner.json</code> file. It strips secrets before
            writing and changes nothing on your machine.
          </li>
          <li>
            <strong>Open it in the browser.</strong> Drop that file into{" "}
            <Link href="/inventory">the inventory tool</Link>. The parsing happens entirely
            in-browser; the file is held in <code className="inline">localStorage</code> only. Nothing
            is uploaded, and there is no backend.
          </li>
          <li>
            <strong>Sort by what you actually use.</strong> The scan reads your local transcripts to
            count real usage, so you can see at a glance what you lean on versus what you installed and
            never touched, including MCP servers and agents that carry no usage count in plain config.
          </li>
          <li>
            <strong>Filter to duplicates.</strong> Use the Duplicates filter to jump straight to the
            overlaps that plugins introduced, then decide which copy to keep.
          </li>
          <li>
            <strong>Export a cleanup plan.</strong> Tick what you do not need and export a plan: a
            paste-to-Claude prompt, a shell script, or JSON that you review and run yourself. The tool
            never deletes anything for you.
          </li>
        </ul>
        <p>
          Two minutes of scanning replaces an hour of folder-spelunking, and you end up with a
          decision-ready list instead of a vague sense that something is bloated.
        </p>

        <h2>Where to start</h2>
        <p>
          If you want to clean up your Claude Code setup today, start with the{" "}
          <Link href="/setup">setup guide</Link> to run the scan, then open{" "}
          <Link href="/inventory">the inventory tool</Link> to see everything split by global and
          project scope, sorted by real usage, with duplicates flagged. It is free, open source, and
          runs entirely on your machine.
        </p>

        <div className="guide-cta">
          <Link href="/setup" className="btn btn-secondary btn-sm">
            Setup guide <Arrow size={14} />
          </Link>
          <Link href="/inventory" className="btn btn-primary btn-sm">
            <Upload size={14} /> Open the inventory
          </Link>
        </div>
      </article>

      {/* page-scoped styles: design-system variables only */}
      <style>{`
        .guide { max-width: 760px; }
        .guide-crumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--dim);
          margin-bottom: 22px;
        }
        .guide-crumbs a { color: var(--accent-soft); text-decoration: none; }
        .guide-crumbs a:hover { text-decoration: underline; }
        .guide-crumbs span[aria-hidden] { color: var(--faint); }
        .guide-body {
          margin-top: 36px;
          color: var(--fg-soft);
          font-size: 16px;
          line-height: 1.72;
        }
        .guide-body h2 {
          font-size: 22px;
          font-weight: 660;
          letter-spacing: -0.02em;
          color: var(--fg);
          margin-top: 40px;
          margin-bottom: 14px;
          padding-top: 16px;
          border-top: 1px solid var(--line);
        }
        .guide-body h2:first-child { margin-top: 0; padding-top: 0; border-top: 0; }
        .guide-body p { margin-bottom: 18px; }
        .guide-body p strong { color: var(--fg); font-weight: 620; }
        .guide-body a {
          color: var(--accent-soft);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .guide-body a:hover { color: var(--accent); }
        .guide-body ul {
          margin: 0 0 18px;
          padding-left: 22px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .guide-body li { line-height: 1.65; }
        .guide-body li strong { color: var(--fg); font-weight: 620; }
        .guide-body code.inline { font-size: 0.88em; }
        .guide-cta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 36px;
          padding-top: 24px;
          border-top: 1px solid var(--line);
        }
        @media (max-width: 480px) {
          .guide-body { font-size: 15.5px; }
          .guide-body h2 { font-size: 20px; }
        }
      `}</style>
    </div>
  );
}
