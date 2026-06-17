import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";

const SITE = "https://claude-inventory-tool.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Claude Inventory Tool — see & organize your Claude Code setup",
    template: "%s · Claude Inventory Tool",
  },
  description:
    "A free tool to see, organize, and clean up your Claude Code skills, plugins, MCP servers, and agents — split by global vs. project. Runs locally, sends nothing.",
  keywords: ["Claude Code", "skills", "plugins", "MCP", "agents", "inventory", "cleanup"],
  openGraph: {
    title: "Claude Inventory Tool",
    description:
      "See and organize every Claude Code skill, plugin, MCP server, and agent — global vs. project. Free, local, private.",
    url: SITE,
    siteName: "Claude Inventory Tool",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Claude Inventory Tool",
    description: "See and organize your Claude Code skills, plugins, MCP servers, and agents.",
  },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
