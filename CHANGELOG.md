# Changelog

All notable changes to Stack Cleaner are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Why this file matters to you.** You run the scanner as a remote one-liner and
> the web app parses the JSON it produces. So two kinds of change are always
> called out here in plain terms:
>
> - **Redaction rules** (in `public/scan.mjs`) — anything that changes what gets
>   replaced with `<redacted>` or rewritten to `~`. Read these before you run the
>   scan again.
> - **Schema changes** (a `schemaVersion` bump in `lib/types.ts`) — anything that
>   changes the shape of `stack-cleaner.json`. Read these before you drop an
>   older file into a newer app, or a newer file into an older one.

## [Unreleased]

## [1.2.0] - 2026-06-19

### Added

- **Overlap and duplicate detection.** The scanner now records what each plugin
  bundles (`bundles` field per plugin item): which skills, agents, and MCP servers
  ship inside it. The inventory uses this to flag three kinds of redundancy:
  - *Superseded standalone items* -- a skill, agent, or MCP server you also have
    installed standalone but which a plugin already provides.
  - *Same-name duplicates* -- two items of the same type with the same name across
    different scopes or projects.
  - *Duplicate MCP servers* -- the same MCP server name configured from more than
    one source.
  Each overlap carries a recommended survivor (the plugin copy wins over standalone;
  otherwise the higher-usage copy wins) so the drawer can apply a principled clean-up.
- **"Overlaps" filter.** A new filter button in the inventory toolbar narrows the
  view to items flagged as redundant, letting you act on them without scrolling
  through the full list.
- **Redundant stat.** The stats bar now shows a "redundant" count alongside the
  existing skill / agent / MCP / plugin totals.
- **One-click "Select N redundant copies" action.** A single button pre-selects all
  redundant items and opens the cleanup drawer, ready to generate the remove script.
- **`SCHEMA_VERSION` bumped to 2.** Scan files produced without `bundles` (i.e.
  from any version before 1.2.0) still load and parse correctly -- the field is
  optional and the overlap pass simply produces no overlap signals for those files.

## [1.1.5] - 2026-06-18

### Changed

- **Rebranded to Stack Cleaner.** The product, the npm package (now `stack-cleaner`,
  run with `npx stack-cleaner@latest`), the GitHub repository, and the site
  (**https://stackcleaner.com**) are all renamed from "Claude Inventory Tool". The
  tool's function is unchanged: it still scans and cleans up your Claude Code setup.
  The old npm package `claude-inventory-tool` is deprecated and points here. The scan
  output file is now `stack-cleaner.json` (the web app accepts any filename, so files
  produced by older versions still load fine).

## [1.1.4] - 2026-06-18

### Fixed

- **Two projects that share a folder name no longer collapse into one.** The
  scanner labeled each project by its bare basename, so two repos both named (say)
  `web` at different paths merged into a single inventory group with one on-disk
  location (last write wins). Colliding projects are now disambiguated by their
  parent directory (`a/web`, `b/web`), falling back to the full path if even that
  collides. No `schemaVersion` change and no change to redaction.

### Added

- A unit-test suite (`vitest`, run with `npm test`) covering the privacy-critical
  secret redaction (`scrubSecrets` / `redactArgs` / `redactUrl` / `looksLikeToken`),
  the inventory parser and phantom-`$HOME` de-duplication, and the new
  project-label disambiguation. Repository-only; it is not part of the published
  npm package (the CLI still ships zero runtime dependencies).
- GitHub Actions CI that runs the tests and a production build on every push and
  pull request.

### Changed

- Swept em-dashes out of the repository docs (README, CONTRIBUTING, SECURITY,
  SUPPORT, CODE_OF_CONDUCT, the PR template), matching the website-copy sweep from
  1.1.3. Prose only; code samples are untouched.

## [1.1.3] - 2026-06-17

### Added

- Each scope group in the inventory now shows its on-disk location next to the
  name (e.g. `~/.claude` for Global, `~/Documents/GitHub/.claude` for a project).
  Makes it obvious where a skill or agent actually lives, and which folder a
  project group maps to.
- **Explicit per-project location from the scanner.** `public/scan.mjs` now emits
  a `projectLocations` map (each project basename to its on-disk `.claude`
  directory). The web app prefers it when labeling a project group, so a project
  that has only MCP servers (and therefore no path-bearing item to derive a
  location from) still shows where it lives. Backward compatible: older scans omit
  the map and the app falls back to deriving the path from item paths. No
  `schemaVersion` change and no change to redaction.

### Changed

- Swept em-dashes out of the rendered website copy (landing, setup, FAQ,
  inventory, demo data, and page metadata), replacing each with natural
  punctuation. Copy only; no behavior change.

## [1.1.2] - 2026-06-17

### Fixed

- **Duplicate "phantom project" named after your username.** When `$HOME` was in
  `~/.claude.json`'s project list (or the scan ran from your home directory), the
  scanner treated `~/.claude` as both the global scope *and* a project, re-listing
  every global skill and agent under a project named after your username. The
  scanner now skips any project whose `.claude` is the global one. The web app
  also defensively drops the phantom project on load: any project whose files all
  live under `~/.claude` is really the global scope wearing a project hat, so it is
  removed entirely (MCP servers included, not just path-duplicated skills). Files
  from an older scanner render correctly on reload without a re-scan. No
  `schemaVersion` change.

## [1.1.1] - 2026-06-17

### Fixed

- The published npm package no longer declares `next` / `react` / `react-dom` as
  runtime dependencies, so `npx stack-cleaner` installs nothing beyond the
  zero-dependency scanner (it uses only Node built-ins). Those packages power the
  web app and are now dev/build-only; Vercel still installs them during the build.

## [1.1.0] - 2026-06-17

Readiness and productization work, getting the tool ready for a wider audience.
No `schemaVersion` bump — files produced by the 1.0.0 scanner still parse, and an
older app still reads the new fields (they're all optional and additive).

### Added

- **An `npx` entry point for the scanner.** Run `npx stack-cleaner`
  (or `npm i -g stack-cleaner` then `stack-cleaner`) to scan with
  one command — identical on macOS, Windows, and Linux, with no `curl … | node`
  pipe. It runs the same `scan.mjs`, just delivered through npm; the curl
  one-liners stay as the read-it-first / no-npm alternatives. New flags carried
  through: `--stdout`/`--print`, `--out <file>`, `--transcripts-dir <dir>`, and
  `--no-transcripts`.
- **Real usage counts for skills, agents, and MCP servers from your transcripts.**
  The scan now streams your local Claude Code session logs
  (`~/.claude/projects/*.jsonl`) and counts how many times each item was actually
  invoked, plus when it was last used — so the tool can finally surface
  *installed but never used*, even for MCP servers and agents, which carry no
  usage count in plain config. New optional JSON fields per item
  (`invocationCount`, `lastUsed`, `usageSource`) and a top-level `usageSummary`;
  all additive, so older files still parse. **Privacy:** the transcript read
  extracts **only** tool / skill / agent / MCP-server names, counts, and
  timestamps — never prompt or message text, tool arguments, file paths, `cwd`,
  or command contents — and it all stays local until you choose to upload.
  Opt out with `--no-transcripts`. See `SECURITY.md` for the full handling note.
- Social-preview (Open Graph / Twitter) image, plus `robots`, `sitemap`,
  a web app manifest, and canonical URLs for the three routes — so links shared
  to the tool render a card, and the pages are indexable.
- A screen-reader-announced error when an uploaded file can't be parsed, and an
  upload size guard that rejects implausibly large files before parsing.
- An in-app FAQ, and a full docs set: `SECURITY.md`, `CONTRIBUTING.md`,
  `SUPPORT.md`, `CODE_OF_CONDUCT.md`, `docs/FAQ.md`, `docs/USAGE.md`, and
  GitHub issue / pull-request templates.

### Changed

- MCP servers and agents are no longer shown as *passive* by default — with the
  transcript signal they now carry real invocation counts, and only fall back to
  **No signal** when nothing matched (or you scanned with `--no-transcripts`).

### Fixed

- The Windows PowerShell scan command now works as written (the previous form
  was copied for `bash` and failed in PowerShell).
- The scanner now reads YAML block-scalar descriptions (`>` and `|`) from
  `SKILL.md` frontmatter correctly, instead of truncating or mangling them.

### Security

- **Redaction hardened** (`public/scan.mjs`). Two more cases are now stripped:
  - **MCP server URL path segments** — not just the host and query string, so a
    secret embedded in a URL path can no longer slip through.
  - **Inline-header arguments** — token-looking values passed inline on a command
    (for example, an `Authorization` header given as a single argument) are now
    redacted.

  The documented caveat is unchanged: skill and agent **descriptions** are copied
  verbatim from frontmatter and are **not** scrubbed — so don't keep secrets in a
  `SKILL.md` or agent description. See `SECURITY.md` for how to report a redaction
  failure (privately — never as a public issue).

## [1.0.0] - 2026-06-17

Initial public release.

### Added

- **The scanner** (`public/scan.mjs`) — a zero-dependency Node script (`node:`
  built-ins only) that reads a local Claude Code install and writes
  `stack-cleaner.json`. It enumerates **every project** Claude Code knows
  about from `~/.claude.json` (not just the current folder), and captures:
  - **Skills** from `SKILL.md` frontmatter (global and per-project),
  - **Agents** from `*.md` files (global and per-project),
  - **Plugins** from `installed_plugins.json`,
  - **MCP servers** from `~/.claude.json` and per-project `.mcp.json`.

  It attaches **real usage counts** (`usageCount` / `lastUsedAt`) for skills and
  plugins from Claude Code's own `skillUsage` / `pluginUsage` tables. MCP servers
  and agents have no usage signal in local config, so they're shown as *passive*.

- **The inventory web app** — a Next.js 15 (App Router) + TypeScript app with a
  plain-CSS design system, no backend and no database. You drop your
  `stack-cleaner.json` in; it's parsed **in your browser** and stored only in
  `localStorage` — never uploaded. It groups everything by **global vs. project**,
  shows the real usage counts, and offers filters to find dead weight.

- **The three-format cleanup export.** Select the items you want gone and the tool
  generates, for you to review and run yourself:
  - a **paste-to-Claude** prompt,
  - a **shell script** of the exact remove commands, and
  - a **JSON** selection for your own tooling.

  The tool never installs, modifies, or removes anything — it only produces text.

- **The landing page** and a **guided, non-technical setup wizard** (`/setup`)
  that walks a first-time user through the scan copy-paste by copy-paste.

### Security

- **Secrets are redacted before the file is written.** MCP `env` values, auth
  headers, URL credentials and query strings, and token-looking command arguments
  are replaced with `<redacted>`. The home directory is rewritten to `~` so
  usernames don't leak. One documented caveat: skill and agent **descriptions**
  are copied verbatim from frontmatter and are **not** scrubbed.

- **The scan only reads.** It makes no network request and never installs,
  modifies, or removes anything.

[Unreleased]: https://github.com/BespokeWoodcraftStudio/stack-cleaner/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/BespokeWoodcraftStudio/stack-cleaner/releases/tag/v1.0.0
