"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "./icons";

export function CopyButton({
  text, label = "Copy", copiedLabel = "Copied", className = "btn btn-secondary btn-sm", size = 14,
}: {
  text: string; label?: string; copiedLabel?: string; className?: string; size?: number;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const onCopy = useCallback(async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      // Fallback for non-secure contexts.
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      document.body.removeChild(ta);
    }
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } else {
      // Don't claim success we didn't get — tell the user how to copy by hand.
      setFailed(true);
      window.setTimeout(() => setFailed(false), 2600);
    }
  }, [text]);

  const text2 = failed ? "Press ⌘/Ctrl+C" : copied ? copiedLabel : label;
  return (
    <button
      type="button"
      className={className}
      onClick={onCopy}
      aria-label={failed ? "Couldn't copy automatically. Select the text and press Ctrl or Cmd + C" : label}
    >
      {copied ? <Check size={size} /> : <Copy size={size} />}
      <span aria-live="polite">{text2}</span>
    </button>
  );
}
