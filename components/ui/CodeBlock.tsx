import { CopyButton } from "./CopyButton";

/** A command/code block with a copy button in the corner. */
export function CodeBlock({ code, copyLabel = "Copy" }: { code: string; copyLabel?: string }) {
  return (
    <div className="codeblock">
      <div className="copy">
        <CopyButton text={code} label={copyLabel} className="btn btn-ghost btn-sm" />
      </div>
      <code>{code}</code>
    </div>
  );
}
