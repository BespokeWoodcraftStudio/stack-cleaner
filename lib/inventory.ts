// =============================================================
// Inventory logic — parse/validate uploaded scans, group, filter,
// compute stats, and build the cleanup manifest. Pure functions, no DOM.
// =============================================================

import type {
  Inventory, InventoryItem, ItemType, Scope, UsageClass, UsageSource, UsageSummary,
} from "./types";
import { SCHEMA_VERSION } from "./types";

export const TYPE_ORDER: ItemType[] = ["skill", "plugin", "mcp", "agent"];

export const TYPE_META: Record<ItemType, { label: string; plural: string; blurb: string }> = {
  skill:  { label: "Skill",  plural: "Skills",  blurb: "Slash-command capabilities Claude can invoke." },
  plugin: { label: "Plugin", plural: "Plugins", blurb: "Bundles of skills, agents, hooks, and MCP servers." },
  mcp:    { label: "MCP",    plural: "MCP servers", blurb: "External tool servers (browsers, APIs, data)." },
  agent:  { label: "Agent",  plural: "Agents",  blurb: "Specialized sub-agents Claude can dispatch." },
};

export const USAGE_META: Record<UsageClass, { label: string; tone: string }> = {
  good:    { label: "Used",        tone: "good" },
  warn:    { label: "Unused (recent)", tone: "warn" },
  bad:     { label: "Unused",      tone: "bad" },
  info:    { label: "Passive",     tone: "info" },
  unknown: { label: "No signal",   tone: "muted" },
};

// ---------- validation / parsing ----------

export class InventoryError extends Error {}

function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

/**
 * Remove the artifacts of an older scan that treated $HOME as a "project".
 * When $HOME was registered in ~/.claude.json's projects (or the scan ran from
 * $HOME), the home dir's `.claude` — which IS the global scope — got scanned as
 * a project named after the username, re-listing global skills, agents, AND its
 * project-scoped MCP servers.
 *
 * Two passes:
 *  1. Drop any project that is a "shadow of global" — it has at least one
 *     path-bearing item and EVERY path-bearing item points at a file already
 *     listed under global (i.e. its `.claude` is the global one). The whole
 *     phantom project is removed, including pathless items like MCP servers that
 *     a path-only de-dup would miss.
 *  2. Fallback: collapse any remaining items that share an identical `path`,
 *     preferring the global copy.
 *
 * A real project's files live under its own repo path, never under ~/.claude, so
 * legitimate projects are never touched (a same-named skill at a different path
 * is kept). Fixed at the source in scan.mjs@1.1.2; this keeps already-generated
 * files correct on reload too.
 */
function collapseScanDuplicates(items: InventoryItem[]): InventoryItem[] {
  const globalPaths = new Set(
    items.filter((i) => i.scope === "global" && i.path).map((i) => i.path as string),
  );

  // Group project items by project name, then flag projects whose every
  // path-bearing item is actually a global file (the phantom $HOME project).
  const projectItems = new Map<string, InventoryItem[]>();
  for (const it of items) {
    if (it.scope !== "project") continue;
    const key = it.project || "unknown";
    const arr = projectItems.get(key);
    if (arr) arr.push(it); else projectItems.set(key, [it]);
  }
  const shadowProjects = new Set<string>();
  for (const [proj, its] of projectItems) {
    const pathed = its.filter((i) => i.path);
    if (pathed.length > 0 && pathed.every((i) => globalPaths.has(i.path as string))) {
      shadowProjects.add(proj);
    }
  }
  const pruned = items.filter(
    (it) => !(it.scope === "project" && shadowProjects.has(it.project || "unknown")),
  );

  // Fallback: collapse any remaining exact path-duplicates, preferring global.
  const winner = new Map<string, InventoryItem>();
  for (const it of pruned) {
    if (!it.path) continue;
    const cur = winner.get(it.path);
    if (!cur || (cur.scope !== "global" && it.scope === "global")) winner.set(it.path, it);
  }
  const taken = new Set<string>();
  return pruned.filter((it) => {
    if (!it.path) return true;
    if (winner.get(it.path) !== it) return false;
    if (taken.has(it.path)) return false;
    taken.add(it.path);
    return true;
  });
}

/** Validate + normalize an unknown blob (parsed from an uploaded file or paste). */
export function parseInventory(raw: unknown): Inventory {
  if (!raw || typeof raw !== "object") {
    throw new InventoryError("That doesn't look like an inventory file (expected a JSON object).");
  }
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.items)) {
    throw new InventoryError(
      "Missing an `items` array. Make sure you uploaded the file scan.mjs produced (claude-inventory.json).",
    );
  }

  const rawItems: InventoryItem[] = [];
  obj.items.forEach((it, i) => {
    if (!it || typeof it !== "object") return;
    const r = it as Record<string, unknown>;
    const rawType = r.type;
    if (typeof rawType !== "string" || !TYPE_ORDER.includes(rawType as ItemType)) return;
    const type = rawType as ItemType;
    const scope: Scope = r.scope === "project" ? "project" : "global";
    const name = asString(r.name) || `item-${i}`;
    const project = scope === "project" ? asString(r.project) || "unknown" : null;
    const usageClass = (["good", "warn", "bad", "info", "unknown"] as UsageClass[]).includes(
      r.usageClass as UsageClass,
    ) ? (r.usageClass as UsageClass) : "unknown";
    const usageSource = (["transcripts", "claude-json", "none"] as UsageSource[]).includes(
      r.usageSource as UsageSource,
    ) ? (r.usageSource as UsageSource) : undefined;

    const source = asString(r.source);
    rawItems.push({
      id: asString(r.id) || `${type}:${scope === "global" ? "global" : "project:" + project}:${name}`,
      type, scope, project, name,
      description: asString(r.description) || "",
      source,
      path: asString(r.path),
      version: asString(r.version),
      usageCount: typeof r.usageCount === "number" ? r.usageCount : null,
      lastUsedAt: typeof r.lastUsedAt === "number" ? r.lastUsedAt : null,
      usageClass,
      usageLabel: asString(r.usageLabel),
      // Transcript usage signal (all optional / backward compatible).
      invocationCount: typeof r.invocationCount === "number" ? r.invocationCount : undefined,
      lastUsed: typeof r.lastUsed === "number" ? r.lastUsed : null,
      usageSource,
      overlap: asString(r.overlap),
      removeCmd: asString(r.removeCmd) || deriveRemoveCmd({ type, scope, project, name, source } as InventoryItem),
    });
  });

  // Remove duplicates from an older scan that registered $HOME as a phantom
  // project (drops the whole shadow-of-global project, MCP servers included).
  // Keeps already-uploaded files correct on reload, not just fresh scans.
  const items = collapseScanDuplicates(rawItems);

  if (!items.length) {
    throw new InventoryError("The file parsed, but it has no recognizable items.");
  }

  const projects = [...new Set(items.filter((i) => i.scope === "project" && i.project).map((i) => i.project as string))]
    .sort((a, b) => a.localeCompare(b));

  // The authoritative summary comes from the scan JSON; only compute a fallback
  // when it's absent. Old JSON without a usageSummary still parses cleanly.
  const usageSummary = parseUsageSummary(obj.usageSummary) ?? computeUsageSummary(items);

  return {
    schemaVersion: typeof obj.schemaVersion === "number" ? obj.schemaVersion : SCHEMA_VERSION,
    generatedAt: asString(obj.generatedAt) || new Date(0).toISOString(),
    generator: asString(obj.generator) || "unknown",
    machine: (obj.machine as Inventory["machine"]) || undefined,
    projects,
    items,
    usageSummary,
  };
}

/** A number from an unknown blob, clamped to a non-negative integer; `fallback` otherwise. */
function asCount(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.trunc(v)) : fallback;
}

/** Coerce an unknown blob into a UsageSummary, or undefined when it isn't an object. */
function parseUsageSummary(raw: unknown): UsageSummary | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const s = raw as Record<string, unknown>;
  return {
    totalInvocations: asCount(s.totalInvocations),
    itemsWithUsage: asCount(s.itemsWithUsage),
    itemsUnused: asCount(s.itemsUnused),
    transcriptsScanned: asCount(s.transcriptsScanned),
    generatedFrom: asString(s.generatedFrom),
  };
}

/**
 * Fallback usage summary computed from parsed items. The authoritative summary
 * is the one in the scan JSON (which also counts unmatched transcript keys);
 * this is only used when the JSON omits it.
 */
export function computeUsageSummary(items: InventoryItem[]): UsageSummary {
  let totalInvocations = 0, itemsWithUsage = 0, itemsUnused = 0;
  for (const it of items) {
    const n = typeof it.invocationCount === "number" ? it.invocationCount : 0;
    totalInvocations += n;
    if (n > 0) {
      itemsWithUsage++;
    } else if (typeof it.invocationCount === "number" && it.type !== "plugin") {
      // Tracked (skill/agent/mcp) but never invoked.
      itemsUnused++;
    }
  }
  return { totalInvocations, itemsWithUsage, itemsUnused, transcriptsScanned: 0 };
}

/** Fallback remove command when a scan didn't include one. */
export function deriveRemoveCmd(it: Pick<InventoryItem, "type" | "scope" | "project" | "name" | "source">): string {
  const { type, scope, name, source } = it;
  switch (type) {
    // The CLI needs the name@marketplace form; `source` carries the marketplace.
    case "plugin": return source
      ? `claude plugins uninstall ${name}@${source.split(" ")[0]} -y`
      : `claude plugins uninstall ${name} -y`;
    case "mcp":    return scope === "global" ? `claude mcp remove ${name} -s user` : `claude mcp remove ${name}`;
    case "agent":  return scope === "global" ? `rm ~/.claude/agents/${name}.md` : `git rm .claude/agents/${name}.md`;
    case "skill":  return scope === "global" ? `rm -rf ~/.claude/skills/${name}` : `git rm -r .claude/skills/${name}`;
    default:       return `# remove ${name}`;
  }
}

// ---------- stats ----------

export interface Stats {
  total: number;
  global: number;
  project: number;
  byType: Record<ItemType, number>;
  byUsage: Record<UsageClass, number>;
  unusedCount: number; // bad + warn
}

export function computeStats(items: InventoryItem[]): Stats {
  const byType = { skill: 0, plugin: 0, mcp: 0, agent: 0 } as Record<ItemType, number>;
  const byUsage = { good: 0, warn: 0, bad: 0, info: 0, unknown: 0 } as Record<UsageClass, number>;
  let global = 0, project = 0;
  for (const it of items) {
    byType[it.type]++;
    byUsage[it.usageClass || "unknown"]++;
    if (it.scope === "global") global++; else project++;
  }
  return {
    total: items.length, global, project, byType, byUsage,
    unusedCount: byUsage.bad + byUsage.warn,
  };
}

// ---------- filtering ----------

export interface Filters {
  query: string;
  type: ItemType | "all";
  scope: Scope | "all";
  project: string | "all";
  usage: UsageClass | "all" | "unused"; // "unused" = bad+warn
}

export const DEFAULT_FILTERS: Filters = {
  query: "", type: "all", scope: "all", project: "all", usage: "all",
};

export function filterItems(items: InventoryItem[], f: Filters): InventoryItem[] {
  const q = f.query.trim().toLowerCase();
  return items.filter((it) => {
    if (f.type !== "all" && it.type !== f.type) return false;
    if (f.scope !== "all" && it.scope !== f.scope) return false;
    if (f.project !== "all" && (it.project || "") !== f.project) return false;
    if (f.usage === "unused" && !(it.usageClass === "bad" || it.usageClass === "warn")) return false;
    if (f.usage !== "all" && f.usage !== "unused" && it.usageClass !== f.usage) return false;
    if (q) {
      const hay = `${it.name} ${it.description || ""} ${it.source || ""} ${it.project || ""} ${it.overlap || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/**
 * Derive the on-disk `.claude` directory a group's items live in, from their
 * paths (the part up to and including `/.claude`, e.g.
 * `~/Documents/GitHub/.claude/skills/x` → `~/Documents/GitHub/.claude`). Returns
 * undefined when no item carries a path (e.g. an MCP-only project).
 */
function deriveLocation(items: InventoryItem[]): string | undefined {
  for (const it of items) {
    if (!it.path) continue;
    const i = it.path.indexOf("/.claude/");
    if (i > 0) return it.path.slice(0, i) + "/.claude";
  }
  return undefined;
}

/**
 * Group items first by scope (global/project), then projects split out by name.
 * Each group carries its on-disk `path` so the UI can show people exactly where
 * those skills/agents live on their computer.
 */
export function groupByScope(items: InventoryItem[]): { key: string; label: string; scope: Scope; project: string | null; path?: string; items: InventoryItem[] }[] {
  const globals = items.filter((i) => i.scope === "global");
  const groups: ReturnType<typeof groupByScope> = [];
  if (globals.length) groups.push({ key: "global", label: "Global", scope: "global", project: null, path: "~/.claude", items: globals });
  const projects = [...new Set(items.filter((i) => i.scope === "project").map((i) => i.project || "unknown"))]
    .sort((a, b) => a.localeCompare(b));
  for (const p of projects) {
    const projItems = items.filter((i) => i.scope === "project" && (i.project || "unknown") === p);
    groups.push({
      key: `project:${p}`, label: p, scope: "project", project: p,
      path: deriveLocation(projItems),
      items: projItems,
    });
  }
  return groups;
}

// ---------- cleanup manifest ----------

const TYPE_LABEL: Record<ItemType, string> = {
  skill: "Skills", plugin: "Plugins", mcp: "MCP servers", agent: "Agents",
};

/** A copy-pasteable shell manifest of the remove commands for the selected items. */
export function buildShellManifest(selected: InventoryItem[]): string {
  const lines = [
    "#!/usr/bin/env bash",
    "# Claude Inventory Tool — cleanup manifest",
    `# ${selected.length} item(s) selected for removal. REVIEW before running.`,
    "# Project-scoped items run from inside that project's repo.",
    "set -e",
    "",
  ];
  for (const type of TYPE_ORDER) {
    const group = selected.filter((i) => i.type === type);
    if (!group.length) continue;
    lines.push(`# ── ${TYPE_LABEL[type]} (${group.length}) ──`);
    for (const it of group) {
      const where = it.scope === "project" ? ` [${it.project}]` : "";
      lines.push(`# ${it.name}${where}`);
      lines.push(it.removeCmd || deriveRemoveCmd(it));
    }
    lines.push("");
  }
  return lines.join("\n");
}

/** A prompt the user can paste back to Claude to do the removals for them. */
export function buildClaudePrompt(selected: InventoryItem[]): string {
  const bullet = (it: InventoryItem) =>
    `- ${TYPE_META[it.type].label.toLowerCase()} \`${it.name}\`${it.scope === "project" ? ` (project: ${it.project})` : " (global)"} → \`${it.removeCmd || deriveRemoveCmd(it)}\``;
  return [
    "Please remove these Claude Code items from my setup. Run each command, confirm it worked, and tell me if anything fails. Don't touch anything not on this list.",
    "",
    ...selected.map(bullet),
  ].join("\n");
}

/** Structured JSON export of the selection. */
export function buildSelectionJSON(selected: InventoryItem[]): string {
  return JSON.stringify({
    generatedBy: "claude-inventory-tool",
    count: selected.length,
    items: selected.map((it) => ({
      id: it.id, type: it.type, scope: it.scope, project: it.project,
      name: it.name, removeCmd: it.removeCmd || deriveRemoveCmd(it),
    })),
  }, null, 2);
}
