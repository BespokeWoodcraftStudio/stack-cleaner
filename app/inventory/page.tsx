import type { Metadata } from "next";
import { InventoryClient } from "@/components/inventory/InventoryClient";

export const metadata: Metadata = {
  title: "Inventory",
  description:
    "See every Claude skill, plugin, MCP server, and agent (split by global vs. project) and build a cleanup plan. Runs locally.",
  alternates: { canonical: "/inventory" },
  openGraph: {
    title: "Claude Inventory Tool: your inventory",
    description:
      "See every Claude skill, plugin, MCP server, and agent (split by global vs. project) and build a cleanup plan. Runs locally.",
    url: "/inventory",
  },
};

export default function InventoryPage() {
  return <InventoryClient />;
}
