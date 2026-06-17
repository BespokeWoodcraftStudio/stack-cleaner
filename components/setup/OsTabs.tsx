"use client";

import { useState } from "react";

type Os = "mac" | "windows";

/**
 * A tiny Mac / Windows toggle for "Open your terminal" instructions.
 * Kept self-contained so the rest of the /setup page can stay a server component.
 */
export function OsTabs() {
  const [os, setOs] = useState<Os>("mac");

  return (
    <div className="stack gap-3">
      <div className="row gap-1" role="tablist" aria-label="Choose your operating system">
        <button
          type="button"
          role="tab"
          aria-selected={os === "mac"}
          className={`chip${os === "mac" ? " active" : ""}`}
          onClick={() => setOs("mac")}
        >
          Mac
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={os === "windows"}
          className={`chip${os === "windows" ? " active" : ""}`}
          onClick={() => setOs("windows")}
        >
          Windows
        </button>
      </div>

      {os === "mac" ? (
        <ol className="setup-list" aria-label="Open Terminal on Mac">
          <li>
            Press <span className="kbd">⌘</span> <span className="kbd">Space</span> to open
            Spotlight search.
          </li>
          <li>
            Type <code className="inline">Terminal</code> and press{" "}
            <span className="kbd">Enter</span>.
          </li>
          <li>A small window with a blinking cursor opens. That&apos;s it — you&apos;re ready.</li>
        </ol>
      ) : (
        <ol className="setup-list" aria-label="Open PowerShell on Windows">
          <li>
            Click the <strong>Start</strong> menu (the Windows logo, bottom-left).
          </li>
          <li>
            Type <code className="inline">PowerShell</code> and press{" "}
            <span className="kbd">Enter</span>.
          </li>
          <li>A blue or black window with a cursor opens. That&apos;s your terminal.</li>
        </ol>
      )}
    </div>
  );
}
