import { describe, it, expect } from "vitest";
import {
  parseInventory,
  computeStats,
  filterItems,
  groupByScope,
  deriveRemoveCmd,
  buildShellManifest,
  DEFAULT_FILTERS,
} from "../lib/inventory";
import type { InventoryItem } from "../lib/types";

describe("parseInventory — validation", () => {
  it("rejects non-objects and blobs without an items array", () => {
    expect(() => parseInventory(null)).toThrow();
    expect(() => parseInventory({})).toThrow();
  });

  it("rejects a blob with no recognizable items", () => {
    expect(() => parseInventory({ items: [] })).toThrow();
    expect(() => parseInventory({ items: [{ type: "bogus", name: "x" }] })).toThrow();
  });

  it("normalizes valid items and drops unknown types", () => {
    const inv = parseInventory({
      items: [
        { type: "skill", scope: "global", name: "a" },
        { type: "nonsense", scope: "global", name: "skip" },
      ],
    });
    expect(inv.items).toHaveLength(1);
    expect(inv.items[0].name).toBe("a");
  });
});

describe("collapseScanDuplicates (via parseInventory)", () => {
  it("drops the whole phantom $HOME project, MCP servers included, but keeps real projects", () => {
    const inv = parseInventory({
      items: [
        { type: "skill", scope: "global", name: "foo", path: "~/.claude/skills/foo" },
        // phantom project named after the user: every path-bearing item is a global file
        { type: "skill", scope: "project", project: "alex", name: "foo", path: "~/.claude/skills/foo" },
        { type: "mcp", scope: "project", project: "alex", name: "ghost", source: "npx ghost" },
        // a real project living outside ~/.claude
        { type: "skill", scope: "project", project: "web", name: "bar", path: "~/code/web/.claude/skills/bar" },
      ],
    });
    expect(inv.items.some((i) => i.project === "alex")).toBe(false); // phantom gone, incl. ghost MCP
    expect(inv.items.map((i) => i.name).sort()).toEqual(["bar", "foo"]);
    expect(inv.projects).toEqual(["web"]);
  });
});

describe("parseProjectLocations (via parseInventory)", () => {
  it("keeps string→string entries and drops the rest", () => {
    const inv = parseInventory({
      items: [{ type: "mcp", scope: "project", project: "api", name: "x", source: "npx x" }],
      projectLocations: { api: "~/code/api/.claude", bad: 123, empty: "" },
    });
    expect(inv.projectLocations).toEqual({ api: "~/code/api/.claude" });
  });
});

describe("groupByScope", () => {
  it("labels an MCP-only project from the explicit projectLocations map", () => {
    const inv = parseInventory({
      items: [{ type: "mcp", scope: "project", project: "api", name: "x", source: "npx x" }],
      projectLocations: { api: "~/code/api/.claude" },
    });
    const group = groupByScope(inv.items, inv.projectLocations).find((g) => g.project === "api");
    expect(group?.path).toBe("~/code/api/.claude"); // would be undefined without the map (MCP has no path)
  });

  it("falls back to deriving the location from item paths for older scans", () => {
    const inv = parseInventory({
      items: [{ type: "skill", scope: "project", project: "web", name: "bar", path: "~/code/web/.claude/skills/bar" }],
    });
    const group = groupByScope(inv.items).find((g) => g.project === "web");
    expect(group?.path).toBe("~/code/web/.claude");
  });

  it("always gives the global group ~/.claude", () => {
    const inv = parseInventory({ items: [{ type: "skill", scope: "global", name: "a", path: "~/.claude/skills/a" }] });
    expect(groupByScope(inv.items)[0]).toMatchObject({ scope: "global", path: "~/.claude" });
  });
});

describe("computeStats & filterItems", () => {
  const inv = parseInventory({
    items: [
      { type: "skill", scope: "global", name: "a", usageClass: "good" },
      { type: "mcp", scope: "project", project: "p", name: "b", usageClass: "bad" },
    ],
  });

  it("counts totals, scope split, types, and unused", () => {
    const s = computeStats(inv.items);
    expect(s).toMatchObject({ total: 2, global: 1, project: 1 });
    expect(s.byType.skill).toBe(1);
    expect(s.unusedCount).toBe(1); // the "bad" one
  });

  it("filters by scope, type, and usage", () => {
    expect(filterItems(inv.items, { ...DEFAULT_FILTERS, scope: "global" })).toHaveLength(1);
    expect(filterItems(inv.items, { ...DEFAULT_FILTERS, type: "mcp" })).toHaveLength(1);
    expect(filterItems(inv.items, { ...DEFAULT_FILTERS, usage: "unused" })).toHaveLength(1);
    expect(filterItems(inv.items, { ...DEFAULT_FILTERS, query: "zzz" })).toHaveLength(0);
  });
});

describe("deriveRemoveCmd & buildShellManifest", () => {
  it("derives the right uninstall command per type/scope", () => {
    const cmd = (it: Partial<InventoryItem>) => deriveRemoveCmd(it as InventoryItem);
    expect(cmd({ type: "skill", scope: "global", name: "x", project: null })).toBe("rm -rf ~/.claude/skills/x");
    expect(cmd({ type: "mcp", scope: "project", name: "y", project: "p" })).toBe("claude mcp remove y");
    expect(cmd({ type: "plugin", scope: "global", name: "z", source: "market 1.0.0", project: null })).toBe(
      "claude plugins uninstall z@market -y",
    );
  });

  it("emits a runnable bash manifest for the selection", () => {
    const m = buildShellManifest([
      { id: "skill:global:x", type: "skill", scope: "global", project: null, name: "x", usageClass: "bad", removeCmd: "rm -rf ~/.claude/skills/x" } as InventoryItem,
    ]);
    expect(m).toContain("#!/usr/bin/env bash");
    expect(m).toContain("rm -rf ~/.claude/skills/x");
  });
});

describe("parseInventory — bundles", () => {
  it("keeps a plugin's bundles and ignores bundles on non-plugins", () => {
    const inv = parseInventory({
      schemaVersion: 2,
      items: [
        { type: "plugin", scope: "global", name: "p", source: "m 1.0.0", bundles: { skills: ["a", "b"], junk: 1 } },
        { type: "skill", scope: "global", name: "a", bundles: { skills: ["nope"] } },
      ],
    });
    const plugin = inv.items.find((i) => i.type === "plugin");
    const skill = inv.items.find((i) => i.type === "skill");
    expect(plugin?.bundles).toEqual({ skills: ["a", "b"] });
    expect(skill?.bundles).toBeUndefined();
  });
});
