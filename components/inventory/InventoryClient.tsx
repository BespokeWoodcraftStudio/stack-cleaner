"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import type { Inventory, InventoryItem, ItemType, UsageClass } from "@/lib/types";
import {
  computeStats, filterItems, groupByScope, DEFAULT_FILTERS,
  TYPE_META, TYPE_ORDER, USAGE_META, type Filters,
} from "@/lib/inventory";
import { demoInventory } from "@/lib/demo";
import { UploadPanel } from "./UploadPanel";
import { CleanupDrawer } from "./CleanupDrawer";
import { Search, Trash, Upload, Shield } from "@/components/ui/icons";
import { CopyButton } from "@/components/ui/CopyButton";

const LS_INV = "cit:inventory:v1";
const LS_SRC = "cit:source:v1";
const LS_SEL = "cit:selected:v1";

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
        const inv = JSON.parse(rawInv) as Inventory;
        if (inv && Array.isArray(inv.items)) {
          setInventory(inv);
          setIsDemo(false);
          setSourceName(localStorage.getItem(LS_SRC) || "your inventory");
        }
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

  const items = inventory.items;
  const stats = useMemo(() => computeStats(items), [items]);
  const filtered = useMemo(() => filterItems(items, filters), [items, filters]);
  const groups = useMemo(() => groupByScope(filtered), [filtered]);
  const selectedItems = useMemo(() => items.filter((i) => selected.has(i.id)), [items, selected]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);
  const selectMany = useCallback((ids: string[], on: boolean) => {
    setSelected((prev) => { const n = new Set(prev); for (const id of ids) on ? n.add(id) : n.delete(id); return n; });
  }, []);

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 40 }}>
      <div className="row between wrap gap-3" style={{ marginBottom: 18 }}>
        <div className="stack gap-1">
          <h1 style={{ fontSize: 26 }}>Your inventory</h1>
          <div className="muted" style={{ fontSize: 14 }}>
            {isDemo
              ? "Exploring demo data — every skill, plugin, MCP server, and agent, split by where it lives."
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

      <StatStrip stats={stats} filters={filters} setFilters={setFilters} />

      <FilterBar inventory={inventory} stats={stats} filters={filters} setFilters={setFilters} />

      <div className="row between" style={{ margin: "10px 2px 16px" }}>
        <div className="muted" style={{ fontSize: 13 }}>
          {filtered.length === items.length
            ? `${items.length} items`
            : `${filtered.length} of ${items.length} items`}
        </div>
        {filtered.length > 0 && (
          <div className="row gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => selectMany(filtered.filter((i) => i.usageClass === "bad" || i.usageClass === "warn").map((i) => i.id), true)}>
              Select unused in view
            </button>
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
              key={g.key} label={g.label} scope={g.scope} items={g.items}
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
function StatStrip({ stats, filters, setFilters }: {
  stats: ReturnType<typeof computeStats>; filters: Filters; setFilters: (f: Filters) => void;
}) {
  const cells = [
    { num: stats.total, lbl: "total items", onClick: () => setFilters({ ...DEFAULT_FILTERS }) },
    { num: stats.global, lbl: "global", tone: "var(--global)", onClick: () => setFilters({ ...filters, scope: "global", project: "all" }) },
    { num: stats.project, lbl: "project", tone: "var(--project)", onClick: () => setFilters({ ...filters, scope: "project" }) },
    { num: stats.byUsage.good, lbl: "actively used", tone: "var(--good)", onClick: () => setFilters({ ...filters, usage: "good" }) },
    { num: stats.unusedCount, lbl: "unused", tone: "var(--bad)", onClick: () => setFilters({ ...filters, usage: "unused" }) },
  ];
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
        {cells.map((c, i) => (
          <button key={c.lbl} onClick={c.onClick}
            className="stat"
            style={{
              padding: "18px 20px", textAlign: "left", background: "transparent", cursor: "pointer",
              border: "none", borderLeft: i === 0 ? "none" : "1px solid var(--line)", transition: ".14s",
            }}
          >
            <span className="num" style={{ color: c.tone || "var(--fg)" }}>{c.num}</span>
            <span className="lbl">{c.lbl}</span>
          </button>
        ))}
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
      </div>
    </div>
  );
}

// ---------------- group section ----------------
function GroupSection({ label, scope, items, selected, onToggle, onSelectMany }: {
  label: string; scope: "global" | "project"; items: InventoryItem[];
  selected: Set<string>; onToggle: (id: string) => void; onSelectMany: (ids: string[], on: boolean) => void;
}) {
  const unusedIds = items.filter((i) => i.usageClass === "bad" || i.usageClass === "warn").map((i) => i.id);
  const selectedHere = items.filter((i) => selected.has(i.id)).length;
  return (
    <section>
      <div className="row between wrap gap-2" style={{ marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>
        <div className="row gap-2">
          <span className={`badge ${scope}`}><span className="dot" />{scope === "global" ? "Global" : "Project"}</span>
          <strong style={{ fontSize: 15 }}>{label}</strong>
          <span className="muted tnum" style={{ fontSize: 13 }}>{items.length} item{items.length === 1 ? "" : "s"}</span>
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

function ItemRow({ item, checked, onToggle }: { item: InventoryItem; checked: boolean; onToggle: (id: string) => void }) {
  const usageTone = USAGE_META[item.usageClass || "unknown"].tone;
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
          <span className="mono" style={{ fontWeight: 600, fontSize: 14, color: checked ? "var(--fg)" : "var(--fg)", textDecoration: checked ? "line-through" : "none", textDecorationColor: "var(--bad)" }}>
            {item.name}
          </span>
          <span className={`badge ${TYPE_TONE[item.type]}`}>{TYPE_META[item.type].label}</span>
          {item.version && <span className="badge muted">v{item.version}</span>}
          <span className={`badge ${usageTone === "muted" ? "muted" : usageTone}`}>{item.usageLabel || USAGE_META[item.usageClass || "unknown"].label}</span>
        </div>
        {item.description && <div style={{ fontSize: 13.5, color: "var(--fg-soft)" }}>{item.description}</div>}
        {item.overlap && <div className="muted" style={{ fontSize: 12.5, fontStyle: "italic" }}>↳ also: {item.overlap}</div>}
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

function PrivacyNote() {
  return (
    <div className="row gap-2" style={{ marginTop: 28, color: "var(--dim)", fontSize: 13 }}>
      <Shield size={16} />
      <span>
        Everything here stays in your browser. Your inventory is parsed locally and saved only to this device&apos;s
        storage — nothing is ever uploaded. <Trash size={12} /> Clearing resets it.
      </span>
    </div>
  );
}
