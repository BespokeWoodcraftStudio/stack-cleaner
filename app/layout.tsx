import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { JsonLd } from "@/components/JsonLd";
import { SITE, REPO, siteGraph } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Stack Cleaner — Clean up your Claude Code skills, plugins, MCP servers & agents",
    template: "%s · Stack Cleaner",
  },
  description:
    "A free, local tool to see, organize, and clean up your Claude Code setup — skills, plugins, MCP servers, and agents — split by global vs. project, with real usage counts and automatic duplicate detection. No backend, nothing uploaded.",
  applicationName: "Stack Cleaner",
  authors: [{ name: "Bespoke Woodcraft Studio", url: REPO }],
  creator: "Bespoke Woodcraft Studio",
  publisher: "Bespoke Woodcraft Studio",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Stack Cleaner — clean up your Claude Code setup",
    description:
      "See, organize, and clean up every Claude Code skill, plugin, MCP server, and agent — global vs. project, with real usage counts and duplicate detection. Free, local, private.",
    url: SITE,
    siteName: "Stack Cleaner",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stack Cleaner — clean up your Claude Code setup",
    description:
      "See, organize & de-duplicate your Claude Code skills, plugins, MCP servers, and agents. Free, local, private.",
  },
  // Icons come from file conventions: app/icon.svg + app/apple-icon.
};

export const viewport: Viewport = {
  themeColor: "#faf7f1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <JsonLd data={siteGraph} />
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
