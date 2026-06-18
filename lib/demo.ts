// =============================================================
// Demo inventory — the "Try it now" dataset.
//
// This is a real, hand-curated Claude Code inventory (descriptions, overlap
// notes, and usage labels included) so the app is never empty and new
// visitors can explore the full experience before scanning their own setup.
// It mirrors the shape your own scan.mjs produces.
// =============================================================

import type { Inventory, InventoryItem, UsageClass } from "./types";

const PROJECT = "demo-studio"; // stand-in project name for the demo's project-scoped items
const PROJECT_DIR = "~/code/demo-studio"; // realistic on-disk location for the demo project

// Anchor transcript timestamps to the demo's generation time so "last used
// Nd ago" reads sensibly. Each usage tuple is [invocationCount, daysAgo];
// daysAgo === null means tracked but never invoked.
const DEMO_NOW = Date.parse("2026-05-15T00:00:00.000Z");
const DAY = 86400000;
type Usage = [count: number, daysAgo: number | null] | undefined;

/** Build the transcript-usage fields the scan would emit for a tracked item. */
function usageFields(u: Usage): Partial<InventoryItem> {
  if (!u) return {}; // no transcript signal at all (e.g. claude.ai connectors)
  const [count, daysAgo] = u;
  const lastUsed = count > 0 && daysAgo != null ? DEMO_NOW - daysAgo * DAY : null;
  return {
    invocationCount: count,
    lastUsed,
    usageSource: "transcripts",
    // The scan also threads these existing fields so the legacy UI lights up.
    usageCount: count,
    lastUsedAt: lastUsed,
  };
}

function plugin(
  name: string, source: string, usageLabel: string, usageClass: UsageClass,
  description: string, overlap = "", usage?: Usage,
): InventoryItem {
  return {
    id: `plugin:global:${name}`, type: "plugin", scope: "global", project: null,
    name, source, description, overlap: overlap || undefined,
    usageClass, usageLabel,
    removeCmd: `claude plugins uninstall ${name}@${source.split(" ")[0]} -y`,
    ...usageFields(usage),
  };
}

function skill(
  name: string, scope: "global" | "project", usageLabel: string, usageClass: UsageClass,
  description: string, overlap = "", usage?: Usage,
): InventoryItem {
  const project = scope === "project" ? PROJECT : null;
  return {
    id: `skill:${scope === "global" ? "global" : "project:" + project}:${name}`,
    type: "skill", scope, project,
    name, description, overlap: overlap || undefined,
    usageClass, usageLabel,
    path: scope === "global" ? `~/.claude/skills/${name}` : `${PROJECT_DIR}/.claude/skills/${name}`,
    removeCmd: scope === "global"
      ? `rm -rf ~/.claude/skills/${name}`
      : `git rm -r .claude/skills/${name}`,
    ...usageFields(usage),
  };
}

function mcp(
  name: string, scope: "global" | "project", source: string, usageLabel: string,
  usageClass: UsageClass, description: string, usage?: Usage,
): InventoryItem {
  const project = scope === "project" ? PROJECT : null;
  return {
    id: `mcp:${scope === "global" ? "global" : "project:" + project}:${name}`,
    type: "mcp", scope, project, name, source, description,
    usageClass, usageLabel,
    removeCmd: scope === "global" ? `claude mcp remove ${name} -s user` : `claude mcp remove ${name}`,
    ...usageFields(usage),
  };
}

function agent(
  name: string, scope: "global" | "project", usageLabel: string, usageClass: UsageClass,
  description: string, usage?: Usage,
): InventoryItem {
  const project = scope === "project" ? PROJECT : null;
  return {
    id: `agent:${scope === "global" ? "global" : "project:" + project}:${name}`,
    type: "agent", scope, project, name, description,
    usageClass, usageLabel,
    path: scope === "global" ? `~/.claude/agents/${name}.md` : `${PROJECT_DIR}/.claude/agents/${name}.md`,
    removeCmd: scope === "global" ? `rm ~/.claude/agents/${name}.md` : `git rm .claude/agents/${name}.md`,
    ...usageFields(usage),
  };
}

const items: InventoryItem[] = [
  // ---------- plugins (global) ----------
  plugin("claude-code-setup", "claude-plugins-official 1.0.0", "⚠️ never", "warn", "Analyzes a codebase and recommends hooks/skills/MCPs/agents to install.", "", [0, null]),
  plugin("claude-md-management", "claude-plugins-official 1.0.0", "⚠️ never", "warn", "Audit + improve CLAUDE.md files. Capture session learnings.", "", [0, null]),
  plugin("claude-mem", "thedotmack 13.2.0", "✅ 318 calls", "good", "Persistent cross-session memory + observation extraction + mem-search.", "remember plugin already uninstalled", [318, 0]),
  plugin("claude-seo-skills", "lionkiii-seo 1.0.0", "✅ 96 calls", "good", "44 SEO commands — site audits, Ahrefs, GSC, SERP, schema, content briefs.", "user-level seo-* bundle (older versions of the same skills); superseo (partial)", [96, 2]),
  plugin("github", "claude-plugins-official", "⚠️ never", "warn", "Official GitHub MCP — issues, PRs, repos.", "claude.ai Github connector (4 calls); you use gh CLI heavily", [0, null]),
  plugin("hookify", "claude-plugins-official", "⚠️ never", "warn", "Auto-create Claude Code hooks from conversation pattern analysis.", "", [0, null]),
  plugin("playwright", "claude-plugins-official", "✅ 461 calls", "good", "Browser automation MCP by Microsoft — heaviest-used MCP in the stack.", "chrome-devtools-mcp already uninstalled", [461, 1]),
  plugin("pr-review-toolkit", "claude-plugins-official", "⚠️ never", "warn", "6 review-flavor agents (code, comments, silent failures, types, tests, simplifier).", "code-review + greptile + feature-dev already uninstalled — this is the survivor", [0, null]),
  plugin("ralph-loop", "claude-plugins-official 1.0.0", "⚠️ never", "warn", "While-true loop wrapper (Ralph Wiggum technique).", "builtin /loop skill", [0, null]),
  plugin("security-guidance", "claude-plugins-official", "➖ hook-based", "info", "Edit-time hook that warns about injection / XSS / unsafe patterns."),
  plugin("skill-creator", "claude-plugins-official", "⚠️ never", "warn", "Create new skills + run skill evals.", "plugin-dev already uninstalled — this is the survivor", [0, null]),
  plugin("superpowers", "claude-plugins-official 5.1.0", "✅ 73 calls", "good", "Agentic dev methodology — TDD, debugging, planning, parallel agents.", "feature-dev already uninstalled", [73, 3]),
  plugin("superseo", "superseo-skills 0.2.0", "✅ 41 calls", "good", "9 anti-AI-slop SEO writing skills.", "claude-seo-skills; user-level seo-content", [41, 6]),
  plugin("ui-ux-pro-max", "ui-ux-pro-max-skill 2.5.0", "⚠️ never", "warn", "67 styles, 161 palettes, 57 font pairings, shadcn/ui MCP.", "frontend-design already uninstalled", [0, null]),
  plugin("vercel", "claude-plugins-official 0.42.1", "✅ 27 calls", "good", "Vercel ecosystem skills + 3 specialist agents (deployment / perf / AI architect).", "claude.ai Vercel connector (handles deploys — 12 calls)", [27, 1]),

  // ---------- user-level skills (global) ----------
  skill("seo", "global", "✅ 11 hits", "good", "Top-level SEO orchestrator that routes to sub-skills.", "claude-seo-skills:seo (plugin equivalent, newer)", [11, 4]),
  skill("seo-audit", "global", "✅ 5 hits", "good", "Full-site SEO audit, up to 15 specialists.", "claude-seo-skills:seo-audit (enhanced with live Ahrefs/GSC data)", [5, 9]),
  skill("seo-backlinks", "global", "✅ 1 hit", "good", "Backlink profile via Moz/Bing/CommonCrawl.", "claude-seo-skills:seo-ahrefs-backlinks", [1, 23]),
  skill("seo-cluster", "global", "➖ never", "bad", "SERP-based topic clustering.", "claude-seo-skills:seo-cluster; superseo:topic-cluster-planning", [0, null]),
  skill("seo-competitor-pages", "global", "➖ never", "bad", '"X vs Y" / alternatives pages.', "claude-seo-skills:seo-competitor-pages", [0, null]),
  skill("seo-content", "global", "➖ never", "bad", "Content quality + E-E-A-T audit.", "claude-seo-skills:seo-content; superseo:eeat-audit", [0, null]),
  skill("seo-dataforseo", "global", "➖ never", "bad", "DataForSEO MCP wrapper.", "claude-seo-skills:seo-dataforseo", [0, null]),
  skill("seo-drift", "global", "➖ never", "bad", "Detect SEO regressions across snapshots.", "claude-seo-skills:seo-drift", [0, null]),
  skill("seo-ecommerce", "global", "➖ never", "bad", "Product SEO, Shopping, Amazon.", "", [0, null]),
  skill("seo-firecrawl", "global", "➖ never", "bad", "Firecrawl MCP wrapper.", "", [0, null]),
  skill("seo-geo", "global", "✅ 11 dispatches", "good", "AI Overviews / GEO / llms.txt.", "claude-seo-skills:seo-geo", [11, 4]),
  skill("seo-google", "global", "✅ 8 dispatches", "good", "GSC, CrUX, PageSpeed, GA4.", "claude-seo-skills:seo-gsc-* family", [8, 5]),
  skill("seo-hreflang", "global", "➖ never", "bad", "i18n / hreflang SEO.", "claude-seo-skills:seo-hreflang", [0, null]),
  skill("seo-image-gen", "global", "➖ never", "bad", "OG/social/hero image gen via Gemini.", "", [0, null]),
  skill("seo-images", "global", "➖ never", "bad", "Image optimization audit.", "claude-seo-skills:seo-images", [0, null]),
  skill("seo-local", "global", "➖ never", "bad", "Local SEO + GBP + NAP.", "claude-seo-skills:seo-local", [0, null]),
  skill("seo-maps", "global", "➖ never", "bad", "Geo-grid rank tracking.", "", [0, null]),
  skill("seo-page", "global", "➖ never", "bad", "Single-page SEO deep dive.", "claude-seo-skills:seo-page", [0, null]),
  skill("seo-plan", "global", "➖ never", "bad", "SEO strategy + roadmap.", "claude-seo-skills:seo-plan", [0, null]),
  skill("seo-programmatic", "global", "➖ never", "bad", "pSEO at scale.", "claude-seo-skills:seo-programmatic", [0, null]),
  skill("seo-schema", "global", "✅ 8 dispatches", "good", "Schema.org validation + JSON-LD.", "claude-seo-skills:seo-schema", [8, 5]),
  skill("seo-sitemap", "global", "✅ 7 dispatches", "good", "Sitemap validate + generate.", "claude-seo-skills:seo-sitemap", [7, 7]),
  skill("seo-sxo", "global", "✅ 10 dispatches", "good", "Search Experience Optimization (SERP-back analysis).", "none — unique angle, no plugin equivalent", [10, 4]),
  skill("seo-technical", "global", "✅ 8 dispatches", "good", "Crawl/index/CWV/security audit.", "claude-seo-skills:seo-technical", [8, 5]),
  skill("baoyu-infographic", "global", "➖ never", "bad", "21 layouts × 20 styles infographic generator.", "", [0, null]),
  skill("graphify", "global", "✅ 142 hits", "good", "Any input (code/docs/papers/images) → knowledge graph.", "", [142, 0]),
  skill("deep-research", "global", "➖ never as Skill", "bad", "Long-form research workflow. Kept the user-level copy, updated to latest upstream.", "", [0, null]),

  // ---------- project skills ----------
  skill("ship", "project", "✅ 5 hits", "good", "Run project checks, commit, push.", "commit-commands plugin (but project version is repo-aware)", [5, 2]),
  skill("push-commit", "project", "✅ 14 hits", "good", "Alias for /ship. Heaviest-used project skill.", "ship (literal alias of)", [14, 0]),
  skill("refresh-youtube-list", "project", "➖ never", "bad", "Update a content list via yt-dlp.", "", [0, null]),
  skill("vercel-react-best-practices", "project", "➖ never", "bad", "React/Next.js performance patterns.", "vercel:react-best-practices (plugin skill, duplicate)", [0, null]),

  // ---------- MCP servers ----------
  mcp("ahrefs", "project", "api.ahrefs.com", "✅ 55 calls", "good", "HTTP MCP at api.ahrefs.com. Workhorse for SEO data.", [55, 2]),
  mcp("brightdata", "global", "npx @brightdata/mcp", "✅ 18 calls", "good", "SERP scraping + discovery.", [18, 6]),
  mcp("google-search-console", "global", "npx google-searchconsole-mcp", "⚠️ never", "warn", "Installed but no calls in transcripts — verify before deleting.", [0, null]),
  mcp("playwright", "global", "npx @playwright/mcp", "✅ 461 calls", "good", "Browser automation. Also bundled by the playwright plugin (same MCP, two registrations).", [461, 1]),
  mcp("claude.ai: Canva", "global", "claude.ai connector", "➖ no signal", "unknown", "Web connector — managed at claude.ai/settings/connectors. Not visible in CLI transcripts."),
  mcp("claude.ai: Figma", "global", "claude.ai connector", "➖ no signal", "unknown", "Web connector — managed at claude.ai/settings/connectors. Not visible in CLI transcripts."),
  mcp("claude.ai: Gmail", "global", "claude.ai connector", "➖ no signal", "unknown", "Web connector — managed at claude.ai/settings/connectors. Not visible in CLI transcripts."),
  mcp("claude.ai: Google Drive", "global", "claude.ai connector", "➖ no signal", "unknown", "Web connector — managed at claude.ai/settings/connectors. Not visible in CLI transcripts."),
  mcp("claude.ai: Linear", "global", "claude.ai connector", "➖ no signal", "unknown", "Web connector — managed at claude.ai/settings/connectors. Not visible in CLI transcripts."),
  mcp("claude.ai: Notion", "global", "claude.ai connector", "➖ no signal", "unknown", "Web connector — managed at claude.ai/settings/connectors. Not visible in CLI transcripts."),
  mcp("claude.ai: Similarweb", "global", "claude.ai connector", "➖ no signal", "unknown", "Web connector — managed at claude.ai/settings/connectors. Not visible in CLI transcripts."),
  mcp("claude.ai: Slack", "global", "claude.ai connector", "➖ no signal", "unknown", "Web connector — managed at claude.ai/settings/connectors. Not visible in CLI transcripts."),
  mcp("claude.ai: Zapier", "global", "claude.ai connector", "➖ no signal", "unknown", "Web connector — managed at claude.ai/settings/connectors. Not visible in CLI transcripts."),

  // ---------- agents ----------
  agent("validator-agent", "project", "⚠️ never", "warn", "12-check pre-publish quality gate for guides. Not yet wired.", [0, null]),
  agent("seo-geo", "global", "✅ 11 calls", "good", "GEO / AI Overviews specialist.", [11, 4]),
  agent("seo-sxo", "global", "✅ 10 calls", "good", "SERP-back analysis.", [10, 4]),
  agent("seo-content", "global", "✅ 10 calls", "good", "E-E-A-T + content quality.", [10, 5]),
  agent("seo-technical", "global", "✅ 8 calls", "good", "Crawl/index/CWV/security.", [8, 5]),
  agent("seo-schema", "global", "✅ 8 calls", "good", "Schema.org validation.", [8, 5]),
  agent("seo-google", "global", "✅ 8 calls", "good", "GSC/GA4/CrUX.", [8, 5]),
  agent("seo-backlinks", "global", "✅ 8 calls", "good", "Backlink profile.", [8, 6]),
  agent("seo-sitemap", "global", "✅ 7 calls", "good", "Sitemap validation.", [7, 7]),
  agent("seo-performance", "global", "✅ 7 calls", "good", "CWV / Lighthouse.", [7, 8]),
  agent("seo-visual", "global", "✅ 6 calls", "good", "Above-the-fold + mobile.", [6, 8]),
  agent("seo-cluster", "global", "✅ 5 calls", "good", "Topic clustering.", [5, 11]),
  agent("seo-image-gen", "global", "✅ 4 calls", "good", "OG image planning.", [4, 15]),
  agent("seo-dataforseo", "global", "➖ never", "bad", "DataForSEO wrapper.", [0, null]),
  agent("seo-drift", "global", "➖ never", "bad", "SEO regression detection.", [0, null]),
  agent("seo-ecommerce", "global", "➖ never", "bad", "Product SEO.", [0, null]),
  agent("seo-local", "global", "➖ never", "bad", "Local SEO.", [0, null]),
  agent("seo-maps", "global", "➖ never", "bad", "Geo-grid rank tracking.", [0, null]),
];

// Derive the usage summary from the items so the headline numbers can never
// drift from the rows. The scan produces these same aggregates from real
// transcripts; the demo fakes them but keeps them internally consistent.
const TRACKED = new Set(["skill", "agent", "mcp"]); // plugins aren't counted as "unused" tracked units
const matchedInvocations = items.reduce((sum, it) => sum + (it.invocationCount || 0), 0);
const itemsWithUsage = items.filter((it) => (it.invocationCount || 0) > 0).length;
const itemsUnused = items.filter(
  (it) => TRACKED.has(it.type) && it.usageSource === "transcripts" && (it.invocationCount || 0) === 0,
).length;
// Real transcripts are dominated by built-in tools (Bash/Read/Edit/…) that
// aren't installable items, so total invocations dwarfs the matched sum.
const UNMATCHED_BUILTIN_INVOCATIONS = 38120;

export const demoInventory: Inventory = {
  schemaVersion: 1,
  generatedAt: "2026-05-15T00:00:00.000Z",
  generator: "demo",
  machine: { platform: "darwin", node: "v22" },
  projects: [PROJECT],
  items,
  usageSummary: {
    totalInvocations: matchedInvocations + UNMATCHED_BUILTIN_INVOCATIONS,
    itemsWithUsage,
    itemsUnused,
    transcriptsScanned: 4142,
    generatedFrom: "transcripts",
  },
};
