// =============================================================
// Claude Inventory Tool — shared schema
// The scan script (public/scan.mjs) emits this exact shape, and the
// whole UI reads it. Keep the two in sync; bump SCHEMA_VERSION on change.
// =============================================================

export const SCHEMA_VERSION = 1;

/** The four kinds of things Claude Code installs. */
export type ItemType = "skill" | "plugin" | "mcp" | "agent";

/** Where the item lives. */
export type Scope = "global" | "project";

/**
 * How heavily an item is used, derived from real usage counts when the scan
 * has them (skills + plugins) or left "unknown" when no signal exists
 * (agents, MCP servers).
 */
export type UsageClass = "good" | "warn" | "bad" | "info" | "unknown";

export interface InventoryItem {
  /** Stable unique id, e.g. "skill:global:graphify" or "mcp:project:my-app:ahrefs". */
  id: string;
  type: ItemType;
  scope: Scope;
  /** Project basename for project-scoped items; null for global. */
  project: string | null;
  /** Display name, e.g. "graphify" or "claude-mem@thedotmack". */
  name: string;
  /** Human-readable description (from SKILL.md / agent frontmatter / plugin metadata). */
  description?: string;
  /** Marketplace / origin label for plugins, transport for MCP, etc. */
  source?: string;
  /** Where it lives on disk, home-relative (e.g. "~/.claude/skills/graphify"). */
  path?: string;
  /** Version string for plugins. */
  version?: string;

  // ---- usage signal (optional) ----
  /** Real invocation count when known. */
  usageCount?: number | null;
  /** Epoch ms of last use, when known. */
  lastUsedAt?: number | null;
  /** Pre-classified bucket (the demo ships these; the scan computes them). */
  usageClass?: UsageClass;
  /** Short usage label for display, e.g. "✅ 461 calls" or "never". */
  usageLabel?: string;

  // ---- curation (optional, demo-only / user-added) ----
  /** Note about other items this overlaps/duplicates. */
  overlap?: string;
  /** Suggested command to remove this item (UI can also derive it). */
  removeCmd?: string;
}

export interface Inventory {
  schemaVersion: number;
  /** ISO timestamp the scan ran. */
  generatedAt: string;
  /** Identifies the producer, e.g. "scan.mjs@1.0.0" or "demo". */
  generator: string;
  /** Non-identifying machine hints (platform, node version) — never hostname/user. */
  machine?: { platform?: string; node?: string };
  /** Project basenames discovered, for the project filter. */
  projects: string[];
  items: InventoryItem[];
}
