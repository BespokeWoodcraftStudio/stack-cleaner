import type { Metadata } from "next";
import { InventoryClient } from "@/components/inventory/InventoryClient";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbGraph } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Your Claude Code inventory — skills, plugins, MCP servers & agents",
  description:
    "See every Claude Code skill, plugin, MCP server, and agent — split by global vs. project — with real usage counts and duplicate detection, then build a one-click cleanup plan. Runs locally, nothing uploaded.",
  alternates: { canonical: "/inventory" },
  openGraph: {
    title: "Stack Cleaner: your Claude Code inventory",
    description:
      "See every Claude Code skill, plugin, MCP server, and agent (global vs. project) with usage counts + duplicate detection, then build a cleanup plan. Runs locally.",
    url: "/inventory",
  },
};

export default function InventoryPage() {
  return (
    <>
      <JsonLd data={breadcrumbGraph("Inventory", "/inventory")} />
      <section className="container" style={{ paddingTop: 28, paddingBottom: 0 }}>
        <div className="stack gap-2" style={{ maxWidth: 720 }}>
          <h1 style={{ fontSize: 20 }}>See, organize, and clean up your Claude Code setup</h1>
          <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.6 }}>
            Stack Cleaner lists every Claude Code skill, plugin, MCP server, and agent you have
            installed, split by global ({"~/.claude"}) vs. project ({".claude"}) scope, with real
            usage counts so you can tell what you lean on from what you never touch. It flags
            duplicates and overlaps, then helps you build a one-click cleanup plan.
          </p>
          <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.6 }}>
            Everything parses in your browser from the file the scan writes locally. Nothing is
            uploaded and nothing is changed on your machine.
          </p>
        </div>
      </section>
      <InventoryClient />
    </>
  );
}
