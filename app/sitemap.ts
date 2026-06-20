import type { MetadataRoute } from "next";
import { SITE_URL } from "@/components/inventory/constants";

// Static `lastmod` per route — bump a date only when that page's content
// actually changes. Google stops trusting `lastmod` if it changes on every
// crawl (which `new Date()` would do). `changefreq`/`priority` are omitted —
// Google ignores them.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = "2026-06-19";
  return [
    { url: SITE_URL, lastModified },
    { url: `${SITE_URL}/setup`, lastModified },
    { url: `${SITE_URL}/inventory`, lastModified },
    { url: `${SITE_URL}/guide/clean-up-claude-code`, lastModified },
    { url: `${SITE_URL}/faq`, lastModified },
  ];
}
