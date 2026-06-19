"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import type { Inventory, InventoryItem, ItemType, UsageClass } from "@/lib/types";
import {
  computeStats, filterItems, groupByScope, DEFAULT_FILTERS, parseInventory,
  withOverlaps, redundantIds,
  TYPE_META, TYPE_ORDER, USAGE_META, type Filters,
} from "@/lib/inventory";
import { demoInventory } from "@/lib/demo";
import { UploadPanel } from "./UploadPanel";
import { CleanupDrawer } from "./CleanupDrawer";
import { UsageSummary, fmtCount } from "./UsageSummary";
import { Search, Trash, Upload, Shield } from "@/components/ui/icons";
import { CopyButton } from "@/components/ui/CopyButton";

const LS_INV = "sc:inventory:v1";
const LS_SRC = "sc:source:v1";
const LS_SEL = "sc:selected:v1";

export function InventoryClient() {
  const [inventory, setInventory] = useState<Inventory>(demoInventory);
  const [isDemo, setIsDemo] = useState(true);
  const [sourceName, setSourceName] = useState<string>("demo");
  const [showUpload, setShowUpload] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [hydrated, setHydrated] = useState(false);

  // hydrate from localStorage after mount
  useEffect(() => {
    try {
      const rawInv = localStorage.getItem(LS_INV);
      if (rawInv) {
        // Re-validate through parseInventory so stale/hand-edited storage can
        // never feed unknown item types into the stat reducers.
        const inv = parseInventory(JSON.parse(rawInv));
        setInventory(inv);
        setIsDemo(false);
        setSourceName(localStorage.getItem(LS_SRC) || "your inventory");
      }
      const rawSel = localStorage.getItem(LS_SEL);
      if (rawSel) setSelected(new Set(JSON.parse(rawSel) as string[]));
    } catch { /* ignore corrupt storage */ }
    setHydrated(true);
  }, []);

  // persist selection
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(LS_SEL, JSON.stringify([...selected])); } catch { /* ignore */ }
  }, [selected, hydrated]);

  const loadInventory = useCallback((inv: Inventory, name: string) => {
    setInventory(inv); setIsDemo(false); setSourceName(name);
    setSelected(new Set()); setShowUpload(false); setFilters(DEFAULT_FILTERS);
    try {
      localStorage.setItem(LS_INV, JSON.stringify(inv));
      localStorage.setItem(LS_SRC, name);
      localStorage.removeItem(LS_SEL);
    } catch { /* ignore */ }
  }, []);

  const resetToDemo = useCallback(() => {
    setInventory(demoInventory); setIsDemo(true); setSourceName("demo");
    setSelected(new Set()); setShowUpload(false); setFilters(DEFAULT_FILTERS);
    try { localStorage.removeItem(LS_INV); localStorage.removeItem(LS_SRC); localStorage.removeItem(LS_SEL); }
    catch { /* ignore */ }
  }, []);

  const items = useMemo(() => withOverlaps(inventory.items), [inventory.items]);
  const redundant = useMemo(() => redundantIds(items), [items]);
  const stats = useMemo(() => computeStats(items), [items]);
  const filtered = useMemo(() => filterItems(items, filters), [items, filters]);
  const groups = useMemo(() => groupByScope(filtered, inventory.projectLocations), [filtered, inventory.projectLocations]);
  const selectedItems = useMemo(() => items.filter((i) => selected.has(i.id)), [items, selected]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }, []);
  const selectMany = useCallback((ids: string[], on: boolean) => {
    setSelected((prev) => {
      const n = new Set(prev);
      for (const id of ids) { if (on) n.add(id); else n.delete(id); }
      return n;
    });
  }, []);

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 40 }}>
      <div className="row between wrap gap-3" style={{ marginBottom: 18 }}>
        <div className="stack gap-1">
          <h1 style={{ fontSize: 26 }}>Your inventory</h1>
          <div className="muted" style={{ fontSize: 14 }}>
            {isDemo
              ? "Exploring demo data: every skill, plugin, MCP server, and agent, split by where it lives."
              : <>Scanned from <code className="inline">{sourceName}</code>{inventory.generatedAt && inventory.generatedAt !== new Date(0).toISOString() ? ` · ${new Date(inventory.generatedAt).toLocaleString()}` : ""}{inventory.machine?.platform ? ` · ${inventory.machine.platform}` : ""}</>}
          </div>
        </div>
        <div className="row gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => setShowUpload((v) => !v)}>
            <Upload size={14} /> {isDemo ? "Scan your own" : "Load another"}
          </button>
          {!isDemo && <button className="btn btn-ghost btn-sm" onClick={resetToDemo}>Reset to demo</button>}
        </div>
      </div>

      <PrivacyBanner />

      {isDemo && !showUpload && (
        <div className="card card-2 row between wrap gap-3" style={{ borderColor: "var(--accent-line)", marginBottom: 18 }}>
          <div className="row gap-2">
            <span className="badge accent">Demo</span>
            <span className="muted" style={{ fontSize: 14 }}>This is sample data so you can look around. Scan your own setup to see <em>your</em> skills.</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowUpload(true)}>Scan my setup →</button>
        </div>
      )}

      {showUpload && (
        <div style={{ marginBottom: 22 }}>
          <UploadPanel onLoad={loadInventory} onTryDemo={resetToDemo} compact />
        </div>
      )}

      <StatStrip stats={stats} inventory={inventory} filters={filters} setFilters={setFilters} />

      <UsageSummary inventory={inventory} filters={filters} setFilters={setFilters} />

      <FilterBar inventory={inventory} stats={stats} filters={filters} setFilters={setFilters} />

      <div className="row between" style={{ margin: "10px 2px 16px" }}>
        <div className="muted" style={{ fontSize: 13 }}>
          {filtered.length === items.length
            ? `${items.length} items`
            : `${filtered.length} of ${items.length} items`}
        </div>
        {(redundant.length > 0 || filtered.length > 0 || selected.size > 0) && (
          <div className="row gap-2">
            {redundant.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => selectMany(redundant, true)}>
                Select {redundant.length} redundant {redundant.length === 1 ? "copy" : "copies"}
              </button>
            )}
            {filtered.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => selectMany(filtered.filter((i) => i.usageClass === "bad" || i.usageClass === "warn").map((i) => i.id), true)}>
                Select unused in view
              </button>
            )}
            {selected.size > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>Clear all</button>}
          </div>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 48, color: "var(--dim)" }}>
          Nothing matches these filters.
          <div style={{ marginTop: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</button>
          </div>
        </div>
      ) : (
        <div className="stack gap-4">
          {groups.map((g) => (
            <GroupSection
              key={g.key} label={g.label} scope={g.scope} path={g.path} items={g.items}
              selected={selected} onToggle={toggle} onSelectMany={selectMany}
            />
          ))}
        </div>
      )}

      <PrivacyNote />

      <CleanupDrawer selected={selectedItems} onClear={() => setSelected(new Set())} />
    </div>
  );
}

// ---------------- stat strip ----------------
type StatCell = {
  key: string; display: string; lbl: string; tone?: string;
  aria: string; onClick?: () => void;
};

function StatStrip({ stats, inventory, filters, setFilters }: {
  stats: ReturnType<typeof computeStats>; inventory: Inventory;
  filters: Filters; setFilters: (f: Filters) => void;
}) {
  const usage = inventory.usageSummary;
  const cells: StatCell[] = [
    { key: "total", display: fmtCount(stats.total), lbl: "total items", aria: "Show all items", onClick: () => setFilters({ ...DEFAULT_FILTERS }) },
    { key: "global", display: fmtCount(stats.global), lbl: "global", tone: "var(--global)", aria: "Filter to global items", onClick: () => setFilters({ ...filters, scope: "global", project: "all" }) },
    { key: "project", display: fmtCount(stats.project), lbl: "project", tone: "var(--project)", aria: "Filter to project items", onClick: () => setFilters({ ...filters, scope: "project" }) },
    { key: "used", display: fmtCount(stats.byUsage.good), lbl: "actively used", tone: "var(--good)", aria: "Filter to actively used items", onClick: () => setFilters({ ...filters, usage: "good" }) },
    { key: "unused", display: fmtCount(stats.unusedCount), lbl: "unused", tone: "var(--bad)", aria: "Filter to unused items", onClick: () => setFilters({ ...filters, usage: "unused" }) },
  ];
  if (stats.redundantCount > 0) {
    cells.push({
      key: "redundant", display: fmtCount(stats.redundantCount), lbl: "redundant",
      tone: "var(--bad)", aria: "Filter to items a plugin already provides",
      onClick: () => setFilters({ ...filters, overlapOnly: true }),
    });
  }
  // Transcript-derived cells — only when a usage scan actually ran. Not
  // clickable (they describe the scan, not a filter), so no onClick.
  if (usage) {
    cells.push(
      { key: "invocations", display: fmtCount(usage.totalInvocations), lbl: "invocations", tone: "var(--accent-soft)", aria: `${usage.totalInvocations} total invocations seen in transcripts` },
      { key: "transcripts", display: fmtCount(usage.transcriptsScanned), lbl: "transcripts read", aria: `${usage.transcriptsScanned} transcripts scanned` },
    );
  }
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
        {cells.map((c, i) => {
          const cellStyle = { padding: "18px 20px", borderLeft: i === 0 ? "none" : "1px solid var(--line)" } as const;
          const inner = (
            <>
              <span className="num" style={{ color: c.tone || "var(--fg)" }}>{c.display}</span>
              <span className="lbl">{c.lbl}</span>
            </>
          );
          // Filter cells are buttons; transcript-derived cells just describe
          // the scan, so they render as a non-interactive div.
          return c.onClick ? (
            <button key={c.key} onClick={c.onClick}
              className="stat stat-cell"
              aria-label={`${c.aria} (${c.display})`}
              title={`${c.aria} (${c.display})`}
              style={cellStyle}
            >
              {inner}
            </button>
          ) : (
            <div key={c.key} className="stat stat-cell static" title={c.aria} aria-label={c.aria} style={cellStyle}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- filter bar ----------------
function FilterBar({ inventory, stats, filters, setFilters }: {
  inventory: Inventory; stats: ReturnType<typeof computeStats>; filters: Filters; setFilters: (f: Filters) => void;
}) {
  const typeChips: { key: ItemType | "all"; label: string; n: number }[] = [
    { key: "all", label: "All types", n: stats.total },
    ...TYPE_ORDER.map((t) => ({ key: t, label: TYPE_META[t].plural, n: stats.byType[t] })),
  ];
  const usageChips: { key: Filters["usage"]; label: string; n: number }[] = [
    { key: "all", label: "Any usage", n: stats.total },
    { key: "good", label: "Used", n: stats.byUsage.good },
    { key: "unused", label: "Unused", n: stats.unusedCount },
    { key: "info", label: "Passive", n: stats.byUsage.info },
  ];

  return (
    <div className="stack gap-2" style={{ marginBottom: 6 }}>
      <div className="row gap-2 wrap">
        <div className="row" style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
          <span style={{ position: "absolute", left: 12, color: "var(--faint)", display: "flex" }}><Search size={15} /></span>
          <input
            className="input" style={{ paddingLeft: 34 }} placeholder="Search name, description, overlap…"
            aria-label="Search inventory"
            value={filters.query} onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          />
        </div>
        <div className="row gap-1">
          {(["all", "global", "project"] as const).map((s) => (
            <button key={s} className={`chip${filters.scope === s ? " active" : ""}`}
              onClick={() => setFilters({ ...filters, scope: s, project: "all" })}>
              {s === "all" ? "All scopes" : s === "global" ? "Global" : "Project"}
              <span className="count">{s === "all" ? stats.total : s === "global" ? stats.global : stats.project}</span>
            </button>
          ))}
        </div>
        {inventory.projects.length > 1 && (
          <select className="input" style={{ width: "auto", minWidth: 150 }}
            aria-label="Filter by project"
            value={filters.project}
            onChange={(e) => setFilters({ ...filters, project: e.target.value, scope: e.target.value === "all" ? filters.scope : "project" })}>
            <option value="all">All projects</option>
            {inventory.projects.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
      </div>
      <div className="row gap-1 wrap">
        {typeChips.map((c) => (
          <button key={c.key} className={`chip${filters.type === c.key ? " active" : ""}`}
            onClick={() => setFilters({ ...filters, type: c.key })}>
            {c.label}<span className="count">{c.n}</span>
          </button>
        ))}
        <span style={{ width: 1, background: "var(--line)", margin: "0 4px" }} />
        {usageChips.map((c) => (
          <button key={String(c.key)} className={`chip${filters.usage === c.key ? " active" : ""}`}
            onClick={() => setFilters({ ...filters, usage: c.key })}>
            {c.label}<span className="count">{c.n}</span>
          </button>
        ))}
        <span style={{ width: 1, background: "var(--line)", margin: "0 4px" }} />
        <button className={`chip${filters.overlapOnly ? " active" : ""}`}
          onClick={() => setFilters({ ...filters, overlapOnly: !filters.overlapOnly })}>
          Overlaps<span className="count">{stats.overlapCount}</span>
        </button>
      </div>
    </div>
  );
}

// ---------------- group section ----------------
function GroupSection({ label, scope, path, items, selected, onToggle, onSelectMany }: {
  label: string; scope: "global" | "project"; path?: string; items: InventoryItem[];
  selected: Set<string>; onToggle: (id: string) => void; onSelectMany: (ids: string[], on: boolean) => void;
}) {
  const unusedIds = items.filter((i) => i.usageClass === "bad" || i.usageClass === "warn").map((i) => i.id);
  const selectedHere = items.filter((i) => selected.has(i.id)).length;
  return (
    <section>
      <div className="row between wrap gap-2" style={{ marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>
        <div className="row gap-2 wrap">
          <span className={`badge ${scope}`}><span className="dot" />{scope === "global" ? "Global" : "Project"}</span>
          <h2 style={{ fontSize: 15, fontWeight: 650, margin: 0 }}>{label}</h2>
          <span className="muted tnum" style={{ fontSize: 13 }}>{items.length} item{items.length === 1 ? "" : "s"}</span>
          {path && (
            <span className="mono faint" style={{ fontSize: 12 }} title={`These ${scope === "global" ? "global" : label} items live in ${path}`}>
              {path}
            </span>
          )}
          {selectedHere > 0 && <span className="badge accent">{selectedHere} selected</span>}
        </div>
        {unusedIds.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={() => onSelectMany(unusedIds, true)}>
            Select {unusedIds.length} unused
          </button>
        )}
      </div>
      <div className="stack gap-2">
        {items.map((it) => <ItemRow key={it.id} item={it} checked={selected.has(it.id)} onToggle={onToggle} />)}
      </div>
    </section>
  );
}

// ---------------- item row ----------------
const TYPE_TONE: Record<ItemType, string> = { skill: "accent", plugin: "info", mcp: "project", agent: "global" };

/** "today" / "3d ago" / "5w ago" / "2mo ago" — compact, low-precision. */
function relativeTime(epochMs: number, now = Date.now()): string {
  const diff = now - epochMs;
  if (diff < 0) return "just now";
  const day = 86400000;
  const days = Math.floor(diff / day);
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 14) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 9) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function ItemRow({ item, checked, onToggle }: { item: InventoryItem; checked: boolean; onToggle: (id: string) => void }) {
  const usageTone = USAGE_META[item.usageClass || "unknown"].tone;
  // The scan threads transcript usage into both the new fields and the
  // existing usageCount/lastUsedAt, so prefer the explicit new fields and
  // fall back to the legacy ones for older scan files.
  const invocations = item.invocationCount ?? item.usageCount ?? null;
  const lastUsed = item.lastUsed ?? item.lastUsedAt ?? null;
  const fromTranscripts = item.usageSource === "transcripts";
  const usageTitle = fromTranscripts && invocations != null
    ? `${invocations} invocation${invocations === 1 ? "" : "s"} found in your transcripts`
    : undefined;
  return (
    <div
      className="card"
      style={{
        padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start",
        borderColor: checked ? "var(--accent-line)" : "var(--line)",
        background: checked ? "var(--accent-tint)" : "var(--panel)", transition: ".12s",
      }}
    >
      <input
        type="checkbox" checked={checked} onChange={() => onToggle(item.id)}
        aria-label={`Select ${item.name} for removal`}
        style={{ width: 17, height: 17, marginTop: 3, accentColor: "var(--accent)", cursor: "pointer", flex: "none" }}
      />
      <div className="stack gap-1 grow" style={{ minWidth: 0 }}>
        <div className="row gap-2 wrap">
          <span className="mono" style={{ fontWeight: 600, fontSize: 14, color: "var(--fg)", textDecorationLine: checked ? "line-through" : "none", textDecorationColor: "var(--bad)" }}>
            {item.name}
          </span>
          <span className={`badge ${TYPE_TONE[item.type]}`}>{TYPE_META[item.type].label}</span>
          {item.version && <span className="badge muted">v{item.version}</span>}
          <span className={`badge ${usageTone === "muted" ? "muted" : usageTone}`} title={usageTitle}>
            {item.usageLabel || USAGE_META[item.usageClass || "unknown"].label}
          </span>
          {lastUsed != null && (
            <span className="faint mono usage-last" title={`Last used ${new Date(lastUsed).toLocaleString()}`}>
              last used {relativeTime(lastUsed)}
            </span>
          )}
        </div>
        {item.description && <div style={{ fontSize: 13.5, color: "var(--fg-soft)" }}>{item.description}</div>}
        {item.overlap && <div className="muted" style={{ fontSize: 12.5, fontStyle: "italic" }}>↳ also: {item.overlap}</div>}
        {item.overlaps && item.overlaps.length > 0 && (() => {
          const redundantRel = item.overlaps.filter((r) => r.role === "redundant");
          const peerRel = item.overlaps.filter((r) => r.role === "peer");
          const survives = item.overlaps.filter((r) => r.role === "survivor").length;
          return (
            <div className="row gap-1 wrap" style={{ marginTop: 1 }}>
              {redundantRel.map((r, i) => (
                <span key={`r${i}`} className="badge bad" title={r.note}>⧉ {r.note}</span>
              ))}
              {peerRel.map((r, i) => (
                <span key={`p${i}`} className="badge info" title={r.note}>⧉ {r.note}</span>
              ))}
              {survives > 0 && (
                <span className="badge good" title="This plugin already provides items you also have installed standalone">
                  ⧉ provides {survives} standalone {survives === 1 ? "copy" : "copies"}
                </span>
              )}
            </div>
          );
        })()}
        {item.source && <div className="faint mono" style={{ fontSize: 12 }}>{item.source}</div>}
        {checked && (
          <div className="row gap-2" style={{ marginTop: 4 }}>
            <code className="inline" style={{ fontSize: 11.5 }}>{item.removeCmd}</code>
            <CopyButton text={item.removeCmd || ""} label="copy cmd" className="btn btn-ghost btn-sm" size={12} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Prominent, reassuring privacy strip shown at the top of the inventory — right
 * where people first see their own skills / MCP servers / agents and might worry
 * the data was uploaded somewhere public. Answers that fear up front: it's local,
 * browser-only, never sent to a server, and invisible to anyone else.
 */
function PrivacyBanner() {
  return (
    <div
      role="note"
      style={{
        marginBottom: 16,
        padding: "11px 14px",
        borderRadius: "var(--radius-sm)",
        background: "var(--good-tint)",
        border: "1px solid color-mix(in srgb, var(--good) 24%, transparent)",
        fontSize: 13,
        lineHeight: 1.55,
      }}
    >
      <span
        aria-hidden="true"
        style={{ color: "var(--good)", display: "inline-flex", verticalAlign: "-3px", marginRight: 7 }}
      >
        <Shield size={15} />
      </span>
      <strong style={{ color: "var(--fg)" }}>Private to this browser.</strong>{" "}
      <span className="muted">
        Your inventory is read on your own machine and saved only in this browser
        (localStorage). Nothing is uploaded to a server, and no one else can see it.
        Open this site on another device and you&apos;ll see only the demo, never your data.
      </span>
    </div>
  );
}

function PrivacyNote() {
  return (
    <div className="row gap-2" style={{ marginTop: 28, color: "var(--dim)", fontSize: 13 }}>
      <Shield size={16} />
      <span>
        Everything here stays in your browser. Your inventory is parsed locally and saved only to this device&apos;s
        storage. Nothing is ever uploaded. <Trash size={12} /> Clearing resets it.
      </span>
    </div>
  );
}
