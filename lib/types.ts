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

/**
 * Where an item's usage signal came from:
 *  - "transcripts"  matched against ~/.claude/projects/*.jsonl invocations
 *  - "claude-json"  derived from ~/.claude.json usage counters
 *  - "none"         no usage signal available
 */
export type UsageSource = "transcripts" | "claude-json" | "none";

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

  // ---- transcript usage signal (optional) ----
  /** Transcript invocations matched to this item (0 = tracked but never used). */
  invocationCount?: number;
  /** Epoch ms of most recent transcript invocation, or null. */
  lastUsed?: number | null;
  /** Where the usage signal came from. */
  usageSource?: UsageSource;

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
  /** Aggregate transcript-usage stats, when a transcript scan ran. */
  usageSummary?: UsageSummary;
}

/** Aggregate usage stats produced by the transcript scan. */
export interface UsageSummary {
  /** Sum of ALL transcript invocations (including keys not matched to an item). */
  totalInvocations: number;
  /** Items with invocationCount > 0. */
  itemsWithUsage: number;
  /** Tracked items (skill/agent/mcp) with invocationCount === 0. */
  itemsUnused: number;
  /** Number of .jsonl transcript files parsed. */
  transcriptsScanned: number;
  /** "transcripts" when the transcript scan produced this summary. */
  generatedFrom?: string;
}
