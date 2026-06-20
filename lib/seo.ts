// =============================================================
// Centralized SEO constants + Schema.org structured data (JSON-LD).
// Rendered via <JsonLd data={...} />. Keep SITE equal to the canonical
// origin (also in app/layout.tsx SITE and components/inventory/constants.ts
// SITE_URL). Bump `softwareVersion` with each release.
// =============================================================

export const SITE = "https://stackcleaner.com";
export const REPO = "https://github.com/BespokeWoodcraftStudio/stack-cleaner";
export const NPM = "https://www.npmjs.com/package/stack-cleaner";
export const SOFTWARE_VERSION = "1.2.2";

const ORG_ID = `${SITE}/#org`;
const WEBSITE_ID = `${SITE}/#website`;

const DESCRIPTION =
  "See, organize, and clean up your Claude Code setup — skills, plugins, MCP servers, and agents — split by global vs. project, with real usage counts and automatic duplicate detection. Free, open source, runs entirely on your machine.";

/** Wrap one or more schema nodes in a single @context @graph block. */
export function graph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}

export const organizationNode = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "Bespoke Woodcraft Studio",
  url: SITE,
  logo: `${SITE}/apple-icon`, // 180×180 PNG (app/apple-icon.tsx)
  sameAs: [REPO, NPM],
};

export const websiteNode = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: "Stack Cleaner",
  url: SITE,
  description: DESCRIPTION,
  publisher: { "@id": ORG_ID },
  inLanguage: "en",
};

/** Site-wide block (Organization + WebSite), rendered once in the root layout. */
export const siteGraph = graph(organizationNode, websiteNode);

/** The product itself — rendered on the homepage. */
export const softwareAppGraph = graph({
  "@type": "SoftwareApplication",
  name: "Stack Cleaner",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "macOS, Windows, Linux",
  url: SITE,
  description: DESCRIPTION,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  isAccessibleForFree: true,
  softwareVersion: SOFTWARE_VERSION,
  license: "https://opensource.org/licenses/MIT",
  downloadUrl: NPM,
  author: { "@id": ORG_ID },
  publisher: { "@id": ORG_ID },
});

/** Breadcrumb for a sub-page: Home › <page>. */
export function breadcrumbGraph(name: string, path: string) {
  return graph({
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name, item: `${SITE}${path}` },
    ],
  });
}

/**
 * Article + BreadcrumbList for a long-form guide page. The Article references
 * the site Organization (by @id) as both author and publisher, and points
 * mainEntityOfPage at its own canonical URL. Dates are static; bump
 * `dateModified` only when the guide's content actually changes.
 */
export function articleGraph({
  headline,
  description,
  path,
  breadcrumbName,
  datePublished = "2026-06-19",
  dateModified = "2026-06-19",
}: {
  headline: string;
  description: string;
  path: string;
  breadcrumbName: string;
  datePublished?: string;
  dateModified?: string;
}) {
  const url = `${SITE}${path}`;
  return graph(
    {
      "@type": "Article",
      headline,
      description,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      url,
      author: { "@id": ORG_ID },
      publisher: { "@id": ORG_ID },
      datePublished,
      dateModified,
      inLanguage: "en-US",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: breadcrumbName, item: url },
      ],
    },
  );
}

/**
 * FAQPage for /faq, in plain text (mirrors the on-page accordion in
 * app/faq/page.tsx — keep the two in sync). Primarily an AI-citation /
 * GEO asset; Google restricts FAQ rich results to gov/health sites.
 */
export const faqGraph = graph({
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is anything uploaded?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The scan runs on your machine and never makes a network request. The web app parses your stack-cleaner.json in the browser and keeps it only in that browser's localStorage. There is no server to upload to.",
      },
    },
    {
      "@type": "Question",
      name: "Can it delete or change anything on my computer?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The scan only reads. The cleanup features only generate text (a paste-to-Claude prompt, a shell script, or JSON) that you review and run yourself. The tool never touches your files.",
      },
    },
    {
      "@type": "Question",
      name: "Are my API keys and secrets safe?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Known secret-bearing fields are redacted before the file is written: MCP env values, auth headers, URL credentials and query strings, and token-looking command arguments all become <redacted>. Your home directory is rewritten to ~ so your username never leaks. One caveat: skill and agent descriptions are prose copied from frontmatter and get only a best-effort scrub, so don't keep secrets in a SKILL.md description.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need a GitHub account or to know the terminal?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The setup wizard is copy-paste: you copy one line, paste it into your terminal, press Enter, and drop the resulting file into the tool. No GitHub account, no coding.",
      },
    },
    {
      "@type": "Question",
      name: "How does it know what I actually use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The scan reads your local Claude Code transcripts (the session logs in ~/.claude/projects) and counts how many times each skill, agent, and MCP server was actually invoked, plus when it was last used — so it can show 'installed but never used.' It reads only the tool, skill, agent, and MCP-server names, the counts, and the timestamps: never your prompts, message text, arguments, file paths, or command contents. Run the scan with --no-transcripts to skip the transcript read entirely.",
      },
    },
    {
      "@type": "Question",
      name: "Does this work on Windows?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The setup page gives you a Windows-specific (PowerShell-safe) command to copy. The scanner is plain Node and runs the same on Windows, macOS, and Linux.",
      },
    },
    {
      "@type": "Question",
      name: "I don't trust 'curl | node'. What else can I do?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You have options: run 'npx stack-cleaner@latest' instead (no pipe, no curl — npm fetches the published, versioned package); or open /scan.mjs, read it (one short, dependency-free file), save it, and run node on the saved file; or clone the repo and run 'node public/scan.mjs' from source. Either way you run the exact same code, just after you've looked at it.",
      },
    },
    {
      "@type": "Question",
      name: "Where is the file saved?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "In the folder your terminal was in when you ran the scan. The scanner prints the exact path with a check mark when it finishes. For a terminal you just opened, it's usually your home folder.",
      },
    },
    {
      "@type": "Question",
      name: "Is this affiliated with Anthropic?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. It's a Bespoke Woodcraft Studio tool, not an Anthropic product. 'Claude' and 'Claude Code' are trademarks of Anthropic.",
      },
    },
    {
      "@type": "Question",
      name: "Is it really free and open source?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes: free and open source under the MIT license. The full source is on GitHub — read it, run it, fork it, or self-host your own copy.",
      },
    },
  ],
});
