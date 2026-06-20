import Link from "next/link";
import { Logo, Github } from "./icons";
import { NavActiveLink } from "./NavActiveLink";

const LINKS = [
  { href: "/", label: "Home", hideSm: true }, // logo already links home
  { href: "/setup", label: "Setup", hideSm: false },
  { href: "/inventory", label: "Inventory", hideSm: false },
  { href: "/guide/clean-up-claude-code", label: "Guide", hideSm: true },
  { href: "/faq", label: "FAQ", hideSm: false },
];

const REPO = "https://github.com/BespokeWoodcraftStudio/stack-cleaner";

export function Nav() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand">
          <span className="glyph"><Logo size={17} /></span>
          <span>Stack Cleaner</span>
        </Link>
        <nav className="nav-links">
          {LINKS.map((l) => (
            <NavActiveLink key={l.href} href={l.href} label={l.label} hideSm={l.hideSm} />
          ))}
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
