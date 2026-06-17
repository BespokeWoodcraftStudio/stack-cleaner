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

function plugin(
  name: string, source: string, usageLabel: string, usageClass: UsageClass,
  description: string, overlap = "",
): InventoryItem {
  return {
    id: `plugin:global:${name}`, type: "plugin", scope: "global", project: null,
    name, source, description, overlap: overlap || undefined,
    usageClass, usageLabel,
    removeCmd: `claude plugins uninstall ${name}@${source.split(" ")[0]} -y`,
  };
}

function skill(
  name: string, scope: "global" | "project", usageLabel: string, usageClass: UsageClass,
  description: string, overlap = "",
): InventoryItem {
  const project = scope === "project" ? PROJECT : null;
  return {
    id: `skill:${scope === "global" ? "global" : "project:" + project}:${name}`,
    type: "skill", scope, project,
    name, description, overlap: overlap || undefined,
    usageClass, usageLabel,
    path: scope === "global" ? `~/.claude/skills/${name}` : `${PROJECT}/.claude/skills/${name}`,
    removeCmd: scope === "global"
      ? `rm -rf ~/.claude/skills/${name}`
      : `git rm -r .claude/skills/${name}`,
  };
}

function mcp(
  name: string, scope: "global" | "project", source: string, usageLabel: string,
  usageClass: UsageClass, description: string,
): InventoryItem {
  const project = scope === "project" ? PROJECT : null;
  return {
    id: `mcp:${scope === "global" ? "global" : "project:" + project}:${name}`,
    type: "mcp", scope, project, name, source, description,
    usageClass, usageLabel,
    removeCmd: scope === "global" ? `claude mcp remove ${name} -s user` : `claude mcp remove ${name}`,
  };
}

function agent(
  name: string, scope: "global" | "project", usageLabel: string, usageClass: UsageClass,
  description: string,
): InventoryItem {
  const project = scope === "project" ? PROJECT : null;
  return {
    id: `agent:${scope === "global" ? "global" : "project:" + project}:${name}`,
    type: "agent", scope, project, name, description,
    usageClass, usageLabel,
    path: scope === "global" ? `~/.claude/agents/${name}.md` : `${PROJECT}/.claude/agents/${name}.md`,
    removeCmd: scope === "global" ? `rm ~/.claude/agents/${name}.md` : `git rm .claude/agents/${name}.md`,
  };
}

const items: InventoryItem[] = [
  // ---------- plugins (global) ----------
  plugin("claude-code-setup", "claude-plugins-official 1.0.0", "⚠️ never", "warn", "Analyzes a codebase and recommends hooks/skills/MCPs/agents to install."),
  plugin("claude-md-management", "claude-plugins-official 1.0.0", "⚠️ never", "warn", "Audit + improve CLAUDE.md files. Capture session learnings."),
  plugin("claude-mem", "thedotmack 13.2.0", "✅ heavy use", "good", "Persistent cross-session memory + observation extraction + mem-search.", "remember plugin already uninstalled"),
  plugin("claude-seo-skills", "lionkiii-seo 1.0.0", "✅ active", "good", "44 SEO commands — site audits, Ahrefs, GSC, SERP, schema, content briefs.", "user-level seo-* bundle (older versions of the same skills); superseo (partial)"),
  plugin("github", "claude-plugins-official", "⚠️ never", "warn", "Official GitHub MCP — issues, PRs, repos.", "claude.ai Github connector (4 calls); you use gh CLI heavily"),
  plugin("hookify", "claude-plugins-official", "⚠️ never", "warn", "Auto-create Claude Code hooks from conversation pattern analysis."),
  plugin("playwright", "claude-plugins-official", "✅ 461 calls", "good", "Browser automation MCP by Microsoft — heaviest-used MCP in the stack.", "chrome-devtools-mcp already uninstalled"),
  plugin("pr-review-toolkit", "claude-plugins-official", "⚠️ never", "warn", "6 review-flavor agents (code, comments, silent failures, types, tests, simplifier).", "code-review + greptile + feature-dev already uninstalled — this is the survivor"),
  plugin("ralph-loop", "claude-plugins-official 1.0.0", "⚠️ never", "warn", "While-true loop wrapper (Ralph Wiggum technique).", "builtin /loop skill"),
  plugin("security-guidance", "claude-plugins-official", "➖ hook-based", "info", "Edit-time hook that warns about injection / XSS / unsafe patterns."),
  plugin("skill-creator", "claude-plugins-official", "⚠️ never", "warn", "Create new skills + run skill evals.", "plugin-dev already uninstalled — this is the survivor"),
  plugin("superpowers", "claude-plugins-official 5.1.0", "✅ used", "good", "Agentic dev methodology — TDD, debugging, planning, parallel agents.", "feature-dev already uninstalled"),
  plugin("superseo", "superseo-skills 0.2.0", "✅ used", "good", "9 anti-AI-slop SEO writing skills.", "claude-seo-skills; user-level seo-content"),
  plugin("ui-ux-pro-max", "ui-ux-pro-max-skill 2.5.0", "⚠️ never", "warn", "67 styles, 161 palettes, 57 font pairings, shadcn/ui MCP.", "frontend-design already uninstalled"),
  plugin("vercel", "claude-plugins-official 0.42.1", "✅ partial", "good", "Vercel ecosystem skills + 3 specialist agents (deployment / perf / AI architect).", "claude.ai Vercel connector (handles deploys — 12 calls)"),

  // ---------- user-level skills (global) ----------
  skill("seo", "global", "✅ 11 hits", "good", "Top-level SEO orchestrator that routes to sub-skills.", "claude-seo-skills:seo (plugin equivalent, newer)"),
  skill("seo-audit", "global", "✅ 5 hits", "good", "Full-site SEO audit, up to 15 specialists.", "claude-seo-skills:seo-audit (enhanced with live Ahrefs/GSC data)"),
  skill("seo-backlinks", "global", "✅ 1 hit", "good", "Backlink profile via Moz/Bing/CommonCrawl.", "claude-seo-skills:seo-ahrefs-backlinks"),
  skill("seo-cluster", "global", "➖ never", "bad", "SERP-based topic clustering.", "claude-seo-skills:seo-cluster; superseo:topic-cluster-planning"),
  skill("seo-competitor-pages", "global", "➖ never", "bad", '"X vs Y" / alternatives pages.', "claude-seo-skills:seo-competitor-pages"),
  skill("seo-content", "global", "➖ never", "bad", "Content quality + E-E-A-T audit.", "claude-seo-skills:seo-content; superseo:eeat-audit"),
  skill("seo-dataforseo", "global", "➖ never", "bad", "DataForSEO MCP wrapper.", "claude-seo-skills:seo-dataforseo"),
  skill("seo-drift", "global", "➖ never", "bad", "Detect SEO regressions across snapshots.", "claude-seo-skills:seo-drift"),
  skill("seo-ecommerce", "global", "➖ never", "bad", "Product SEO, Shopping, Amazon."),
  skill("seo-firecrawl", "global", "➖ never", "bad", "Firecrawl MCP wrapper."),
  skill("seo-geo", "global", "✅ 11 dispatches", "good", "AI Overviews / GEO / llms.txt.", "claude-seo-skills:seo-geo"),
  skill("seo-google", "global", "✅ 8 dispatches", "good", "GSC, CrUX, PageSpeed, GA4.", "claude-seo-skills:seo-gsc-* family"),
  skill("seo-hreflang", "global", "➖ never", "bad", "i18n / hreflang SEO.", "claude-seo-skills:seo-hreflang"),
  skill("seo-image-gen", "global", "➖ never", "bad", "OG/social/hero image gen via Gemini."),
  skill("seo-images", "global", "➖ never", "bad", "Image optimization audit.", "claude-seo-skills:seo-images"),
  skill("seo-local", "global", "➖ never", "bad", "Local SEO + GBP + NAP.", "claude-seo-skills:seo-local"),
  skill("seo-maps", "global", "➖ never", "bad", "Geo-grid rank tracking."),
  skill("seo-page", "global", "➖ never", "bad", "Single-page SEO deep dive.", "claude-seo-skills:seo-page"),
  skill("seo-plan", "global", "➖ never", "bad", "SEO strategy + roadmap.", "claude-seo-skills:seo-plan"),
  skill("seo-programmatic", "global", "➖ never", "bad", "pSEO at scale.", "claude-seo-skills:seo-programmatic"),
  skill("seo-schema", "global", "✅ 8 dispatches", "good", "Schema.org validation + JSON-LD.", "claude-seo-skills:seo-schema"),
  skill("seo-sitemap", "global", "✅ 7 dispatches", "good", "Sitemap validate + generate.", "claude-seo-skills:seo-sitemap"),
  skill("seo-sxo", "global", "✅ 10 dispatches", "good", "Search Experience Optimization (SERP-back analysis).", "none — unique angle, no plugin equivalent"),
  skill("seo-technical", "global", "✅ 8 dispatches", "good", "Crawl/index/CWV/security audit.", "claude-seo-skills:seo-technical"),
  skill("baoyu-infographic", "global", "➖ never", "bad", "21 layouts × 20 styles infographic generator."),
  skill("graphify", "global", "✅ 10 hits", "good", "Any input (code/docs/papers/images) → knowledge graph."),
  skill("deep-research", "global", "➖ never as Skill", "bad", "Long-form research workflow. Kept the user-level copy, updated to latest upstream."),

  // ---------- project skills ----------
  skill("ship", "project", "✅ 5 hits", "good", "Run project checks, commit, push.", "commit-commands plugin (but project version is repo-aware)"),
  skill("push-commit", "project", "✅ 14 hits", "good", "Alias for /ship. Heaviest-used project skill.", "ship (literal alias of)"),
  skill("refresh-youtube-list", "project", "➖ never", "bad", "Update a content list via yt-dlp."),
  skill("vercel-react-best-practices", "project", "➖ never", "bad", "React/Next.js performance patterns.", "vercel:react-best-practices (plugin skill, duplicate)"),

  // ---------- MCP servers ----------
  mcp("ahrefs", "project", "api.ahrefs.com", "✅ 55 calls", "good", "HTTP MCP at api.ahrefs.com. Workhorse for SEO data."),
  mcp("brightdata", "global", "npx @brightdata/mcp", "✅ 18 calls", "good", "SERP scraping + discovery."),
  mcp("google-search-console", "global", "npx google-searchconsole-mcp", "⚠️ 0 visible", "warn", "May be new — verify before deleting."),
  mcp("playwright", "global", "npx @playwright/mcp", "✅ 461 calls", "good", "Browser automation. Also bundled by the playwright plugin (same MCP, two registrations)."),
  mcp("claude.ai: Canva", "global", "claude.ai connector", "➖ never", "bad", "Web connector — managed at claude.ai/settings/connectors."),
  mcp("claude.ai: Figma", "global", "claude.ai connector", "➖ never", "bad", "Web connector — managed at claude.ai/settings/connectors."),
  mcp("claude.ai: Gmail", "global", "claude.ai connector", "➖ never", "bad", "Web connector — managed at claude.ai/settings/connectors."),
  mcp("claude.ai: Google Drive", "global", "claude.ai connector", "➖ never", "bad", "Web connector — managed at claude.ai/settings/connectors."),
  mcp("claude.ai: Linear", "global", "claude.ai connector", "➖ never", "bad", "Web connector — managed at claude.ai/settings/connectors."),
  mcp("claude.ai: Notion", "global", "claude.ai connector", "➖ never", "bad", "Web connector — managed at claude.ai/settings/connectors."),
  mcp("claude.ai: Similarweb", "global", "claude.ai connector", "➖ never", "bad", "Web connector — managed at claude.ai/settings/connectors."),
  mcp("claude.ai: Slack", "global", "claude.ai connector", "➖ never", "bad", "Web connector — managed at claude.ai/settings/connectors."),
  mcp("claude.ai: Zapier", "global", "claude.ai connector", "➖ never", "bad", "Web connector — managed at claude.ai/settings/connectors."),

  // ---------- agents ----------
  agent("validator-agent", "project", "⚠️ 0", "warn", "12-check pre-publish quality gate for guides. Not yet wired."),
  agent("seo-geo", "global", "✅ 11", "good", "GEO / AI Overviews specialist."),
  agent("seo-sxo", "global", "✅ 10", "good", "SERP-back analysis."),
  agent("seo-content", "global", "✅ 10", "good", "E-E-A-T + content quality."),
  agent("seo-technical", "global", "✅ 8", "good", "Crawl/index/CWV/security."),
  agent("seo-schema", "global", "✅ 8", "good", "Schema.org validation."),
  agent("seo-google", "global", "✅ 8", "good", "GSC/GA4/CrUX."),
  agent("seo-backlinks", "global", "✅ 8", "good", "Backlink profile."),
  agent("seo-sitemap", "global", "✅ 7", "good", "Sitemap validation."),
  agent("seo-performance", "global", "✅ 7", "good", "CWV / Lighthouse."),
  agent("seo-visual", "global", "✅ 6", "good", "Above-the-fold + mobile."),
  agent("seo-cluster", "global", "✅ 5", "good", "Topic clustering."),
  agent("seo-image-gen", "global", "✅ 4", "good", "OG image planning."),
  agent("seo-dataforseo", "global", "➖ 0", "bad", "DataForSEO wrapper."),
  agent("seo-drift", "global", "➖ 0", "bad", "SEO regression detection."),
  agent("seo-ecommerce", "global", "➖ 0", "bad", "Product SEO."),
  agent("seo-local", "global", "➖ 0", "bad", "Local SEO."),
  agent("seo-maps", "global", "➖ 0", "bad", "Geo-grid rank tracking."),
];

export const demoInventory: Inventory = {
  schemaVersion: 1,
  generatedAt: "2026-05-15T00:00:00.000Z",
  generator: "demo",
  machine: { platform: "darwin", node: "v22" },
  projects: [PROJECT],
  items,
};
