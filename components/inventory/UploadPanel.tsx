"use client";

import { useState, useRef, useCallback } from "react";
import { parseInventory, InventoryError } from "@/lib/inventory";
import type { Inventory } from "@/lib/types";
import { Upload, Terminal, Shield } from "@/components/ui/icons";
import { ScanCommand } from "@/components/ui/ScanCommand";

// A real scan is a few KB; cap well above that so a stray video/zip drop fails
// fast with a clear message instead of freezing the tab on a synchronous parse.
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export function UploadPanel({
  onLoad, onTryDemo, compact = false,
}: {
  onLoad: (inv: Inventory, sourceName: string) => void;
  onTryDemo: () => void;
  compact?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const ingest = useCallback((raw: string, sourceName: string) => {
    setError(null);
    let parsed: unknown;
    try { parsed = JSON.parse(raw); }
    catch { setError("That isn't valid JSON. Make sure you copied the whole file."); return; }
    try {
      const inv = parseInventory(parsed);
      onLoad(inv, sourceName);
    } catch (e) {
      setError(e instanceof InventoryError ? e.message : "Couldn't read that inventory file.");
    }
  }, [onLoad]);

  const handleFiles = useCallback((files: FileList | null) => {
    const list = files ? Array.from(files) : [];
    if (!list.length) return;
    if (list.length > 1) {
      setError("Please drop a single claude-inventory.json file.");
      return;
    }
    const file = list[0];
    if (file.size > MAX_BYTES) {
      setError(
        `That file is ${(file.size / 1048576).toFixed(1)} MB, too big to be an inventory. ` +
        "A real claude-inventory.json is only a few KB. Pick the file scan.mjs produced.",
      );
      return;
    }
    setError(null);
    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => { setLoading(false); ingest(String(reader.result || ""), file.name); };
    reader.onerror = () => { setLoading(false); setError("Couldn't read that file."); };
    reader.readAsText(file);
  }, [ingest]);

  return (
    <div className="stack gap-4">
      <div
        className="card"
        aria-busy={loading}
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
            <div className="muted" style={{ fontSize: 14 }}>
              {loading ? "Reading your file…" : "or choose it manually: nothing leaves your browser"}
            </div>
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
          <label htmlFor="paste-json" className="muted" style={{ fontSize: 13, fontWeight: 600 }}>
            Paste the contents of <code className="inline">claude-inventory.json</code>
          </label>
          <textarea
            id="paste-json"
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
        <div role="alert" className="card" style={{ borderColor: "var(--bad)", background: "var(--bad-tint)", color: "var(--fg)" }}>
          <strong style={{ color: "var(--bad)" }}>Hmm. </strong>{error}
        </div>
      )}

      {!compact && (
        <div className="card stack gap-3">
          <div className="row gap-2"><Terminal size={16} /><strong style={{ fontSize: 14 }}>Don&apos;t have the file yet?</strong></div>
          <p className="muted" style={{ fontSize: 14 }}>
            Run this in your terminal. It reads your local Claude setup and writes
            <code className="inline"> claude-inventory.json</code> next to you. Zero dependencies, nothing sent anywhere.
          </p>
          <ScanCommand />
          <div className="row gap-2" style={{ color: "var(--good)", fontSize: 13 }}>
            <Shield size={15} />
            <span className="muted">Known secrets (API keys, tokens, MCP env values) are stripped before the file is written.</span>
          </div>
        </div>
      )}
    </div>
  );
}
