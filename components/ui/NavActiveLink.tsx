"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavActiveLink({
  href,
  label,
  hideSm,
}: {
  href: string;
  label: string;
  hideSm?: boolean;
}) {
  const path = usePathname();
  const active = href === "/" ? path === "/" : path.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`nav-link${active ? " active" : ""}${hideSm ? " hide-sm" : ""}`}
    >
      {label}
    </Link>
  );
}
