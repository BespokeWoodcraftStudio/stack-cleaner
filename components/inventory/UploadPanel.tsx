"use client";

import { useState, useRef, useCallback } from "react";
import { parseInventory, InventoryError } from "@/lib/inventory";
import type { Inventory } from "@/lib/types";
import { Upload, Terminal, Shield } from "@/components/ui/icons";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { SCAN_ONELINER } from "./constants";

export function UploadPanel({
  onLoad, onTryDemo, compact = false,
}: {
  onLoad: (inv: Inventory, sourceName: string) => void;
  onTryDemo: () => void;
  compact?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const ingest = useCallback((raw: string, sourceName: string) => {
    setError(null);
    let parsed: unknown;
    try { parsed = JSON.parse(raw); }
    catch { setError("That isn't valid JSON. Make sure you grabbed the whole file."); return; }
    try {
      const inv = parseInventory(parsed);
      onLoad(inv, sourceName);
    } catch (e) {
      setError(e instanceof InventoryError ? e.message : "Couldn't read that inventory file.");
    }
  }, [onLoad]);

  const handleFiles = useCallback((files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => ingest(String(reader.result || ""), file.name);
    reader.onerror = () => setError("Couldn't read that file.");
    reader.readAsText(file);
  }, [ingest]);

  return (
    <div className="stack gap-4">
      <div
        className="card"
        style={{
          border: `1.5px dashed ${dragging ? "var(--accent)" : "var(--line-2)"}`,
          background: dragging ? "var(--accent-tint)" : "var(--panel)",
          transition: ".15s", textAlign: "center", padding: compact ? "28px 22px" : "44px 28px",
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        <div className="stack center gap-3">
          <div className="glyph" style={{ width: 46, height: 46, borderRadius: 12 }}>
            <Upload size={22} />
          </div>
          <div className="stack gap-1 center">
            <div style={{ fontSize: 17, fontWeight: 620 }}>Drop your <code className="inline">claude-inventory.json</code> here</div>
            <div className="muted" style={{ fontSize: 14 }}>or choose it manually — nothing leaves your browser</div>
          </div>
          <div className="row gap-2 wrap center">
            <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>
              <Upload size={15} /> Choose file
            </button>
            <button className="btn btn-secondary" onClick={() => setShowPaste((v) => !v)}>
              Paste JSON instead
            </button>
            <button className="btn btn-ghost" onClick={onTryDemo}>Try the demo</button>
          </div>
          <input
            ref={fileRef} type="file" accept="application/json,.json"
            className="sr-only" onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      {showPaste && (
        <div className="card stack gap-3">
          <label className="muted" style={{ fontSize: 13, fontWeight: 600 }}>
            Paste the contents of <code className="inline">claude-inventory.json</code>
          </label>
          <textarea
            className="input" style={{ minHeight: 140 }}
            placeholder='{ "schemaVersion": 1, "items": [ … ] }'
            value={pasteValue} onChange={(e) => setPasteValue(e.target.value)}
          />
          <div className="row gap-2">
            <button className="btn btn-primary btn-sm" disabled={!pasteValue.trim()}
              onClick={() => ingest(pasteValue, "pasted JSON")}>Load it</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setPasteValue(""); setShowPaste(false); }}>Cancel</button>
          </div>
        </div>
      )}

      {error && (
        <div className="card" style={{ borderColor: "var(--bad)", background: "var(--bad-tint)", color: "var(--fg)" }}>
          <strong style={{ color: "var(--bad)" }}>Hmm — </strong>{error}
        </div>
      )}

      {!compact && (
        <div className="card stack gap-3">
          <div className="row gap-2"><Terminal size={16} /><strong style={{ fontSize: 14 }}>Don&apos;t have the file yet?</strong></div>
          <p className="muted" style={{ fontSize: 14 }}>
            Run this one line in your terminal. It reads your local Claude Code install and writes
            <code className="inline"> claude-inventory.json</code> next to you. Zero dependencies, nothing sent anywhere.
          </p>
          <CodeBlock code={SCAN_ONELINER} />
          <div className="row gap-2" style={{ color: "var(--good)", fontSize: 13 }}>
            <Shield size={15} />
            <span className="muted">Secrets (API keys, tokens, MCP env) are stripped before the file is written.</span>
          </div>
        </div>
      )}
    </div>
  );
}
