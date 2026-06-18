# Changelog

All notable changes to Claude Inventory Tool are recorded here.

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
>   changes the shape of `claude-inventory.json`. Read these before you drop an
>   older file into a newer app, or a newer file into an older one.

## [Unreleased]

### Added

- Each scope group in the inventory now shows its on-disk location next to the
  name (e.g. `~/.claude` for Global, `~/Documents/GitHub/.claude` for a project),
  derived from the items' paths. Makes it obvious where a skill or agent actually
  lives, and which folder a project group maps to.

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
  runtime dependencies, so `npx claude-inventory-tool` installs nothing beyond the
  zero-dependency scanner (it uses only Node built-ins). Those packages power the
  web app and are now dev/build-only; Vercel still installs them during the build.

## [1.1.0] - 2026-06-17

Readiness and productization work, getting the tool ready for a wider audience.
No `schemaVersion` bump — files produced by the 1.0.0 scanner still parse, and an
older app still reads the new fields (they're all optional and additive).

### Added

- **An `npx` entry point for the scanner.** Run `npx claude-inventory-tool`
  (or `npm i -g claude-inventory-tool` then `claude-inventory-tool`) to scan with
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
  `claude-inventory.json`. It enumerates **every project** Claude Code knows
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
  `claude-inventory.json` in; it's parsed **in your browser** and stored only in
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

[Unreleased]: https://github.com/BespokeWoodcraftStudio/claude-inventory-tool/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/BespokeWoodcraftStudio/claude-inventory-tool/releases/tag/v1.0.0
