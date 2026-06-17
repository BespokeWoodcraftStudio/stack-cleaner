import Link from "next/link";
import { Logo, Github } from "./icons";

const REPO = "https://github.com/BespokeWoodcraftStudio/claude-inventory-tool";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container row between wrap gap-3">
        <div className="row gap-2">
          <span className="glyph" style={{ width: 24, height: 24 }}><Logo size={14} /></span>
          <span>Claude Inventory Tool</span>
          <span className="faint hide-sm">· runs locally, sends nothing</span>
        </div>
        <div className="row gap-3">
          <Link href="/setup" className="muted">Setup</Link>
          <Link href="/inventory" className="muted">Inventory</Link>
          <a href={REPO} target="_blank" rel="noopener noreferrer" className="muted row gap-1">
            <Github size={14} /> GitHub
          </a>
        </div>
      </div>
      <div className="container faint" style={{ marginTop: 14, fontSize: 12.5 }}>
        Free &amp; open source · MIT · A Bespoke Woodcraft Studio tool. Not affiliated with Anthropic.
      </div>
    </footer>
  );
}
