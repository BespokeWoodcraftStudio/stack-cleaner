"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo, Github } from "./icons";

const LINKS = [
  { href: "/", label: "Home", hideSm: true }, // logo already links home
  { href: "/setup", label: "Setup", hideSm: false },
  { href: "/inventory", label: "Inventory", hideSm: false },
];

const REPO = "https://github.com/BespokeWoodcraftStudio/claude-inventory-tool";

export function Nav() {
  const path = usePathname();
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand">
          <span className="glyph"><Logo size={17} /></span>
          <span>Claude Inventory<span className="hide-sm" style={{ color: "var(--dim)", fontWeight: 500 }}> Tool</span></span>
        </Link>
        <nav className="nav-links">
          {LINKS.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className={`nav-link${active ? " active" : ""}${l.hideSm ? " hide-sm" : ""}`}>
                {l.label}
              </Link>
            );
          })}
          <a
            href={REPO} target="_blank" rel="noopener noreferrer"
            className="nav-link row gap-1" aria-label="GitHub repository"
            style={{ marginLeft: 4 }}
          >
            <Github size={15} /><span className="hide-sm">GitHub</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
