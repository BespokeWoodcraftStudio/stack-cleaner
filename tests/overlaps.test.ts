import { describe, it, expect } from "vitest";
import { computeOverlaps, normalizeName, withOverlaps, redundantIds, computeStats, filterItems, DEFAULT_FILTERS } from "../lib/inventory";
import type { InventoryItem } from "../lib/types";

const item = (p: Partial<InventoryItem>): InventoryItem => ({
  id: p.id!, type: p.type!, scope: p.scope ?? "global", project: p.project ?? null,
  name: p.name!, ...p,
}) as InventoryItem;

describe("normalizeName", () => {
  it("lowercases, trims, strips plugin: prefix and namespaces", () => {
    expect(normalizeName("Seo-Content")).toBe("seo-content");
    expect(normalizeName("plugin:vercel")).toBe("vercel");
    expect(normalizeName("vercel:deploy")).toBe("deploy");
  });
});

describe("computeOverlaps — bundled-in-plugin", () => {
  const items = [
    item({ id: "plugin:global:claude-seo-skills", type: "plugin", name: "claude-seo-skills",
           bundles: { skills: ["seo-content", "seo-audit"] } }),
    item({ id: "skill:global:seo-content", type: "skill", name: "seo-content" }),
    item({ id: "skill:global:graphify", type: "skill", name: "graphify" }),
  ];
  const map = computeOverlaps(items);

  it("flags the standalone as redundant, superseded by the plugin", () => {
    const rels = map.get("skill:global:seo-content")!;
    expect(rels).toHaveLength(1);
    expect(rels[0]).toMatchObject({ kind: "bundled-in-plugin", role: "redundant", withLabel: "claude-seo-skills" });
    expect(rels[0].note).toContain("claude-seo-skills");
  });

  it("flags the plugin as a survivor of that standalone", () => {
    const rels = map.get("plugin:global:claude-seo-skills")!;
    expect(rels.some((r) => r.role === "survivor" && r.withId === "skill:global:seo-content")).toBe(true);
  });

  it("leaves unrelated items out of the map", () => {
    expect(map.has("skill:global:graphify")).toBe(false);
  });
});

describe("computeOverlaps — duplicate-name and duplicate-mcp", () => {
  const items = [
    item({ id: "skill:global:ship", type: "skill", scope: "global", name: "ship" }),
    item({ id: "skill:project:web:ship", type: "skill", scope: "project", project: "web", name: "ship" }),
    item({ id: "mcp:global:playwright", type: "mcp", scope: "global", name: "playwright", source: "npx @playwright/mcp" }),
    item({ id: "mcp:project:web:playwright", type: "mcp", scope: "project", project: "web", name: "playwright", source: "plugin" }),
  ];
  const map = computeOverlaps(items);

  it("pairs same-name skills as peers (duplicate-name)", () => {
    expect(map.get("skill:global:ship")![0]).toMatchObject({ kind: "duplicate-name", role: "peer" });
  });

  it("pairs same-name MCPs as peers (duplicate-mcp)", () => {
    expect(map.get("mcp:global:playwright")![0]).toMatchObject({ kind: "duplicate-mcp", role: "peer" });
  });
});

describe("computeOverlaps — empty / old data", () => {
  it("returns an empty map when there are no overlaps or no bundles", () => {
    const map = computeOverlaps([
      item({ id: "skill:global:a", type: "skill", name: "a" }),
      item({ id: "plugin:global:p", type: "plugin", name: "p" }), // no bundles (old scan)
    ]);
    expect(map.size).toBe(0);
  });
});

describe("withOverlaps + stats + filter", () => {
  const base = [
    item({ id: "plugin:global:seo", type: "plugin", name: "claude-seo-skills", bundles: { skills: ["seo-content"] } }),
    item({ id: "skill:global:seo-content", type: "skill", name: "seo-content", usageClass: "bad" }),
    item({ id: "skill:global:graphify", type: "skill", name: "graphify", usageClass: "good" }),
  ];
  const annotated = withOverlaps(base);

  it("annotates items with their overlaps and leaves others untouched", () => {
    expect(annotated.find((i) => i.id === "skill:global:seo-content")!.overlaps).toHaveLength(1);
    expect(annotated.find((i) => i.id === "skill:global:graphify")!.overlaps).toBeUndefined();
  });

  it("counts redundant items and lists their ids", () => {
    expect(computeStats(annotated).redundantCount).toBe(1);
    expect(redundantIds(annotated)).toEqual(["skill:global:seo-content"]);
    expect(computeStats(annotated).overlapCount).toBe(2);
  });

  it("filters to overlaps only", () => {
    expect(filterItems(annotated, { ...DEFAULT_FILTERS, overlapOnly: true })).toHaveLength(2);
  });
});
