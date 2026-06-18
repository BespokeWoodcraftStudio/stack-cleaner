"use client";

import { useOs, setOs } from "@/components/ui/use-os";

/**
 * A tiny Mac / Windows toggle for "Open your terminal" instructions. It shares
 * the app-wide OS selection, so choosing here also swaps the scan command shown
 * in Step 2 (and vice-versa). Kept client-side so /setup stays a server component.
 */
export function OsTabs() {
  const os = useOs();

  return (
    <div className="stack gap-3">
      <div className="row gap-1" role="group" aria-label="Choose your operating system">
        <button
          type="button"
          aria-pressed={os === "mac"}
          className={`chip${os === "mac" ? " active" : ""}`}
          onClick={() => setOs("mac")}
        >
          Mac
        </button>
        <button
          type="button"
          aria-pressed={os === "windows"}
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
          <li>A small window with a blinking cursor opens. That&apos;s it. You&apos;re ready.</li>
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
