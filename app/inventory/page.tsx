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
      <InventoryClient />
    </>
  );
}
