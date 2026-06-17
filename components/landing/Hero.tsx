import Link from "next/link";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Arrow, Shield, Terminal } from "@/components/ui/icons";
import { SCAN_ONELINER } from "@/components/inventory/constants";

/**
 * Hero — eyebrow, headline, subhead, two CTAs, the scan one-liner with a
 * "nothing leaves your machine" reassurance, and a faux inventory preview
 * on the side built from real .card / .badge primitives.
 */
export function Hero() {
  return (
    <header className="lp-hero">
      <div className="container">
        <div className="lp-hero-grid">
          {/* ---- copy column ---- */}
          <div className="lp-hero-copy stack">
            <span className="eyebrow">
              <span className="lp-dot" /> Free · open source · runs locally
            </span>

            <h1 className="lp-h1">
              See every Claude skill you&rsquo;ve installed&nbsp;&mdash;{" "}
              <span className="lp-accent">and tidy up the ones you forgot</span>
            </h1>

            <p className="lead lp-subhead">
              A free tool that maps every skill, plugin, MCP server, and agent in your
              Claude Code setup &mdash; split by global vs. project, with real usage
              counts &mdash; so you can clean out the clutter in minutes.
            </p>

            <div className="row gap-2 wrap lp-cta-row">
              <Link href="/inventory" className="btn btn-primary btn-lg">
                Try the live demo <Arrow size={16} />
              </Link>
              <Link href="/setup" className="btn btn-secondary btn-lg">
                Set it up in 2 minutes
              </Link>
            </div>

            <div className="lp-scan stack gap-2">
              <div className="row gap-2 muted lp-scan-label">
                <Terminal size={15} />
                <span>Run this once in your terminal</span>
              </div>
              <CodeBlock code={SCAN_ONELINER} />
              <div className="row gap-1 faint lp-scan-note">
                <Shield size={13} />
                <span>
                  Writes <code className="inline">claude-inventory.json</code> locally.
                  Secrets stripped. Nothing leaves your machine.
                </span>
              </div>
            </div>
          </div>

          {/* ---- visual column: faux inventory preview ---- */}
          <HeroPreview />
        </div>
      </div>
    </header>
  );
}

/** A small, static "inventory preview" — same badges/cards as the real tool. */
function HeroPreview() {
  return (
    <div className="lp-preview hide-sm" aria-hidden="true">
      <div className="card card-2 lp-preview-card">
        <div className="row between" style={{ marginBottom: 14 }}>
          <span className="mono faint" style={{ fontSize: 12 }}>claude-inventory.json</span>
          <span className="badge accent">42 items</span>
        </div>

        {/* global group */}
        <div className="lp-preview-group">
          <div className="row gap-2" style={{ marginBottom: 8 }}>
            <span className="badge global"><span className="dot" />Global</span>
            <span className="faint" style={{ fontSize: 12 }}>~/.claude</span>
          </div>
          <PreviewRow name="commit-helper" type="skill" tone="accent" usage="used 38×" usageTone="good" />
          <PreviewRow name="pdf-extractor" type="skill" tone="accent" usage="never used" usageTone="bad" />
          <PreviewRow name="github" type="mcp" tone="project" usage="used 12×" usageTone="good" />
        </div>

        {/* project group */}
        <div className="lp-preview-group" style={{ marginTop: 14 }}>
          <div className="row gap-2" style={{ marginBottom: 8 }}>
            <span className="badge project"><span className="dot" />Project</span>
            <span className="faint" style={{ fontSize: 12 }}>my-app/.claude</span>
          </div>
          <PreviewRow name="seo-audit" type="plugin" tone="info" usage="used 4×" usageTone="good" />
          <PreviewRow name="old-scraper" type="agent" tone="global" usage="never used" usageTone="bad" />
        </div>
      </div>
    </div>
  );
}

function PreviewRow({
  name, type, tone, usage, usageTone,
}: {
  name: string;
  type: string;
  tone: string;
  usage: string;
  usageTone: "good" | "bad";
}) {
  return (
    <div className="lp-preview-row row gap-2 wrap">
      <span className="mono lp-preview-name">{name}</span>
      <span className={`badge ${tone}`}>{type}</span>
      <span className={`badge ${usageTone}`}>{usage}</span>
    </div>
  );
}
