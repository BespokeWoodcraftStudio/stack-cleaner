"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "./icons";

export function CopyButton({
  text, label = "Copy", copiedLabel = "Copied", className = "btn btn-secondary btn-sm", size = 14,
}: {
  text: string; label?: string; copiedLabel?: string; className?: string; size?: number;
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for non-secure contexts.
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch { /* ignore */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }, [text]);

  return (
    <button type="button" className={className} onClick={onCopy} aria-label={label}>
      {copied ? <Check size={size} /> : <Copy size={size} />}
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
}
