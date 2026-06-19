import type { MetadataRoute } from "next";
import { SITE_URL } from "@/components/inventory/constants";

// Everything is public and crawlable. AI search / assistant crawlers are
// granted explicitly (a stronger discovery + citation signal than a bare
// wildcard); CCBot (bulk training-only scraper) is the one we opt out of.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User"], allow: "/" },
      { userAgent: ["ClaudeBot", "Claude-Web", "anthropic-ai"], allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: ["Googlebot", "Google-Extended", "Bingbot"], allow: "/" },
      { userAgent: "CCBot", disallow: "/" },
      { userAgent: "*", allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
