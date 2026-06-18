"use client";

// =============================================================
// UsageSummary — a concise banner that surfaces transcript-derived
// usage signal (Inventory.usageSummary). Rendered above the FilterBar.
// The "installed but never used" number is a one-click filter that
// activates the existing "unused" usage chip.
// =============================================================

import type { Inventory } from "@/lib/types";
import type { Filters } from "@/lib/inventory";
import { computeStats } from "@/lib/inventory";

export function fmtCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(n);
}

export function UsageSummary({ inventory, filters, setFilters }: {
  inventory: Inventory; filters: Filters; setFilters: (f: Filters) => void;
}) {
  const s = inventory.usageSummary;
  if (!s) return null;

  // The "never used" count must equal the set the chip's filter actually shows,
  // so it's sourced from computeStats (bad + warn) — the same basis as the
  // "unused" filter and the StatStrip cell — not from usageSummary.itemsUnused
  // (which counts only transcript-tracked items and would drift from the filter).
  const neverUsed = computeStats(inventory.items).unusedCount;

  return (
    <div
      className="card card-2 row between wrap gap-3 usage-summary"
      style={{ borderColor: "var(--accent-line)", marginBottom: 16, padding: "14px 18px" }}
    >
      <div className="row gap-2 wrap" style={{ minWidth: 0 }}>
        <span className="badge accent">Usage</span>
        <span className="muted" style={{ fontSize: 13.5 }}>
          Read from <strong style={{ color: "var(--fg-soft)" }}>{fmtCount(s.transcriptsScanned)}</strong>{" "}
          transcript{s.transcriptsScanned === 1 ? "" : "s"} —{" "}
          <strong style={{ color: "var(--fg-soft)" }}>{fmtCount(s.totalInvocations)}</strong> tool invocation
          {s.totalInvocations === 1 ? "" : "s"} recorded.
        </span>
      </div>
      {neverUsed > 0 && (
        <button
          className="chip"
          onClick={() => setFilters({ ...filters, usage: "unused" })}
          aria-label={`Filter to ${neverUsed} installed but never used items`}
          title="Show items that are installed but were never invoked"
        >
          <span className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--bad)", display: "inline-block" }} />
          {fmtCount(neverUsed)} installed, never used
          <span className="count" aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}
