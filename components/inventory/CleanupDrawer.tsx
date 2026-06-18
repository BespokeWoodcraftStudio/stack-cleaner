"use client";

import { useState } from "react";
import type { InventoryItem } from "@/lib/types";
import { buildShellManifest, buildClaudePrompt, buildSelectionJSON } from "@/lib/inventory";
import { CopyButton } from "@/components/ui/CopyButton";
import { Trash } from "@/components/ui/icons";

type Tab = "claude" | "shell" | "json";

const TABS: { key: Tab; label: string; hint: string }[] = [
  { key: "claude", label: "Hand to Claude", hint: "Paste this into Claude and it removes them for you." },
  { key: "shell", label: "Shell script", hint: "Review, then run yourself. Commands are grouped by type." },
  { key: "json", label: "JSON", hint: "Machine-readable selection for your own tooling." },
];

function download(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

export function CleanupDrawer({
  selected, onClear,
}: { selected: InventoryItem[]; onClear: () => void }) {
  const [tab, setTab] = useState<Tab>("claude");
  const [open, setOpen] = useState(true);

  if (!selected.length) return null;

  const content =
    tab === "claude" ? buildClaudePrompt(selected)
    : tab === "shell" ? buildShellManifest(selected)
    : buildSelectionJSON(selected);

  const active = TABS.find((t) => t.key === tab)!;

  return (
    <div
      style={{
        position: "sticky", bottom: 0, zIndex: 40, marginTop: 24,
        background: "color-mix(in srgb, var(--bg-2) 94%, transparent)",
        backdropFilter: "blur(14px)", borderTop: "1px solid var(--accent-line)",
        boxShadow: "0 -12px 40px rgba(0,0,0,.4)",
        borderTopLeftRadius: 18, borderTopRightRadius: 18,
      }}
    >
      <div className="container" style={{ padding: "16px 24px" }}>
        <div className="row between gap-3 wrap">
          <div className="row gap-2">
            <span className="badge accent"><Trash size={13} /> {selected.length} selected for removal</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setOpen((v) => !v)}>
              {open ? "Hide" : "Show"} cleanup plan
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onClear}>Clear selection</button>
          </div>
          <div className="row gap-2">
            <CopyButton text={content} label={`Copy ${active.label.toLowerCase()}`} className="btn btn-primary btn-sm" />
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => download(
                tab === "json" ? "claude-inventory-selection.json" : tab === "shell" ? "claude-cleanup.sh" : "claude-cleanup-prompt.txt",
                content,
                tab === "json" ? "application/json" : "text/plain",
              )}
            >Download</button>
          </div>
        </div>

        {open && (
          <div className="stack gap-2" style={{ marginTop: 14 }}>
            <div className="row gap-1 wrap">
              {TABS.map((t) => (
                <button key={t.key} className={`chip${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="muted" style={{ fontSize: 13 }}>{active.hint}</div>
            <div className="codeblock" style={{ maxHeight: 240, overflow: "auto", whiteSpace: "pre-wrap" }}>
              <code>{content}</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
