// Shared constants for the scan flow. If the deploy URL changes, update here.
export const SITE_URL = "https://claude-inventory-tool.vercel.app";

/** The one-liner users paste into their terminal to produce claude-inventory.json. */
export const SCAN_ONELINER = `curl -fsSL ${SITE_URL}/scan.mjs | node`;

/** Alternative: download then run (for the cautious / offline). */
export const SCAN_TWO_STEP = `curl -fsSL ${SITE_URL}/scan.mjs -o claude-inventory-scan.mjs\nnode claude-inventory-scan.mjs`;
