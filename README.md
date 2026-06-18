<div align="center">

# Claude Inventory Tool

**See, organize, and clean up your Claude Code setup — every skill, plugin, MCP server, and agent, split by _global_ vs. _project_.**

Free · open source · runs locally · sends nothing.

[**Live app →**](https://claude-inventory-tool.vercel.app) &nbsp;·&nbsp; [Guided setup →](https://claude-inventory-tool.vercel.app/setup) &nbsp;·&nbsp; [Try the demo →](https://claude-inventory-tool.vercel.app/inventory)

</div>

---

Over time, Claude Code accumulates a lot: user-level skills in `~/.claude`, project skills in every repo's `.claude`, plugins from a handful of marketplaces, MCP servers wired into different projects, and a pile of sub-agents. It gets hard to answer simple questions — *what do I actually have? what do I never use? what's duplicated? what can I safely remove?*

This tool answers them. You run one command, it reads your local Claude Code install, and the web app shows everything **grouped by where it lives** (global vs. each project), with **real usage counts**, so you can spot the dead weight and build a one-click cleanup plan.

## How it works

```
  ┌─────────────┐      ┌──────────────────────┐      ┌─────────────────────┐
  │  1. Scan    │  →   │  2. See              │  →   │  3. Tidy            │
  │  one line   │      │  global vs project   │      │  cleanup plan, or   │
  │  in terminal│      │  + real usage counts │      │  hand it to Claude  │
  └─────────────┘      └──────────────────────┘      └─────────────────────┘
```

1. **Scan** — run the one-liner below. It writes `claude-inventory.json` next to you. No dependencies, nothing sent anywhere.
2. **See** — drop that file into the [web app](https://claude-inventory-tool.vercel.app/inventory). It's parsed in your browser; nothing is uploaded.
3. **Tidy** — tick the items you want gone and export a shell script, a paste-to-Claude prompt, or JSON.

### The scan

**The one command** — same on macOS, Windows, and Linux, no `curl`, nothing piped:

```bash
npx claude-inventory-tool
```

It runs the published npm package (which bundles the same scanner) and writes `claude-inventory.json` next to you. Node ships with Claude Code, so you already have it.

<details>
<summary>Prefer not to use npm? Download the script straight from this site instead.</summary>

**macOS / Linux** (bash/zsh):

```bash
curl -fsSL https://claude-inventory-tool.vercel.app/scan.mjs | node
```

**Windows** (PowerShell) — `curl` there is an alias for `Invoke-WebRequest`, so call `curl.exe` and download-then-run instead of piping:

```powershell
curl.exe -fsSL https://claude-inventory-tool.vercel.app/scan.mjs -o claude-inventory-scan.mjs; node claude-inventory-scan.mjs
```

</details>

Prefer to read it first? It's one short, dependency-free file ([`public/scan.mjs`](public/scan.mjs)) — download then run (use `curl.exe` on Windows):

```bash
curl -fsSL https://claude-inventory-tool.vercel.app/scan.mjs -o claude-inventory-scan.mjs
node claude-inventory-scan.mjs
```

**Not comfortable in a terminal?** The [**Setup page**](https://claude-inventory-tool.vercel.app/setup) walks you through it copy-paste by copy-paste. You never need a GitHub account or any coding.

## What it captures

For every item it records the type, the scope (global or which project), a description, and a **real usage count** — how many times you've actually invoked it, and when you last did.

| Type | Global source | Project source |
|------|---------------|----------------|
| **Skills** | `~/.claude/skills/*/SKILL.md` | `<repo>/.claude/skills/*/SKILL.md` |
| **Plugins** | `~/.claude/plugins/installed_plugins.json` | — |
| **MCP servers** | `~/.claude.json` → `mcpServers` | per-project `mcpServers` + `.mcp.json` |
| **Agents** | `~/.claude/agents/*.md` | `<repo>/.claude/agents/*.md` |

It enumerates **every project** Claude Code knows about (from `~/.claude.json`), not just the folder you run it in — so you get your whole picture in one pass.

### Where usage counts come from

The scan reads your local Claude Code **transcripts** (`~/.claude/projects/*.jsonl`) to count real invocations for **skills, agents, and MCP servers** — so you can finally see what's *installed but never used*, even for the types that carry no usage count in plain config. It extracts **only the tool / skill / agent / MCP-server names, the counts, and the timestamps** — never your prompts, message text, tool arguments, file paths, or command contents. It all stays local until you choose to upload the file. Pass `--no-transcripts` to skip the transcript read entirely. (Skills and plugins also keep their counts from Claude Code's own `skillUsage` / `pluginUsage` tables.)

## Privacy & safety

This is the part that matters, because the output describes your tooling.

- **Runs entirely on your machine.** The scan never makes a network request. The web app parses your file in the browser and stores it only in that browser's `localStorage` — it is never uploaded.
- **Transcripts: names and counts only.** To compute real usage it streams your local transcripts but extracts **only** tool/skill/agent/MCP-server names, counts, and timestamps — never prompt text, arguments, file paths, or command contents. Opt out with `--no-transcripts`.
- **Secrets are stripped before the file is written.** MCP `env` values, auth headers, URL credentials, and token-looking arguments are replaced with `<redacted>`. Your home directory is rewritten to `~` so your username doesn't leak.
- **It only reads.** The scan never modifies, installs, or removes anything. Removal commands are generated as text for *you* to review and run.
- **No dependencies, no build step to scan.** `scan.mjs` is plain Node with `node:` built-ins only. Read the whole thing in a minute.

## The cleanup plan

Select items and the tool builds three things:

- **Hand to Claude** — a prompt you paste back into Claude Code so it does the removals for you.
- **Shell script** — the exact `claude plugins uninstall …` / `rm -rf ~/.claude/skills/…` / `claude mcp remove …` commands, grouped by type, for you to review and run.
- **JSON** — a machine-readable selection for your own tooling.

Nothing is ever removed by this tool. You stay in control.

## Run it yourself / self-host

It's a standard Next.js (App Router) app with no backend and no database.

```bash
git clone https://github.com/BespokeWoodcraftStudio/claude-inventory-tool
cd claude-inventory-tool
npm install
npm run dev        # http://localhost:3000

# scan your own machine straight from the source:
node public/scan.mjs
```

Or install the published CLI globally and run it from anywhere:

```bash
npm i -g claude-inventory-tool
claude-inventory-tool          # writes claude-inventory.json in the current folder
```

Deploy your own copy to Vercel (or any static-capable Next host) with one click of "Import Project" — there's nothing to configure.

## The inventory schema

The scan emits, and the app reads, a single JSON shape — abbreviated below; the full field list is in [`lib/types.ts`](lib/types.ts):

```jsonc
{
  "schemaVersion": 1,
  "generatedAt": "2026-…",
  "generator": "scan.mjs@1.0.0",
  "machine": { "platform": "darwin", "node": "v22.0.0" },
  "projects": ["my-app", "my-blog"],
  "usageSummary": {             // present when the transcript scan ran
    "totalInvocations": 1280,
    "itemsWithUsage": 24,
    "itemsUnused": 11,
    "transcriptsScanned": 4142,
    "generatedFrom": "transcripts"
  },
  "items": [
    {
      "id": "skill:global:graphify",
      "type": "skill",            // skill | plugin | mcp | agent
      "scope": "global",          // global | project
      "project": null,            // basename for project-scoped items
      "name": "graphify",
      "description": "…",
      "path": "~/.claude/skills/graphify",
      "usageCount": 10,           // mirrors invocationCount when matched
      "lastUsedAt": 1718000000000,
      "usageClass": "good",       // good | warn | bad | info | unknown
      "usageLabel": "✅ 10 uses", // display string
      "invocationCount": 10,      // transcript invocations (0 = tracked, never used)
      "lastUsed": 1718000000000,  // epoch ms of most recent invocation, or null
      "usageSource": "transcripts", // "transcripts" | "claude-json" | "none"
      "removeCmd": "rm -rf ~/.claude/skills/graphify"
    }
  ]
}
```

Because it's just JSON, you can hand-write or generate an inventory from any source and drop it in.

## Project layout

```
public/scan.mjs              the local scanner (zero-dep Node)
lib/types.ts                 the shared inventory schema
lib/inventory.ts             parse / filter / group / manifest logic
lib/demo.ts                  the built-in demo dataset
app/page.tsx                 landing
app/setup/page.tsx           guided, non-technical walkthrough
app/inventory/page.tsx       the tool
components/                  ui primitives + page sections
```

## Documentation

- [**FAQ**](docs/FAQ.md) (or the in-app [/faq](https://claude-inventory-tool.vercel.app/faq)) — is anything uploaded, are my keys safe, can it delete things, Windows support…
- [**Usage guide**](docs/USAGE.md) — a walkthrough of the inventory tool: filtering, selection, and the three cleanup exports.
- [**Setup wizard**](https://claude-inventory-tool.vercel.app/setup) — the non-technical, copy-paste path.
- [**Security policy**](SECURITY.md) — how to privately report a redaction miss (and what we already do).
- [**Support / troubleshooting**](SUPPORT.md) — common errors and where to get help.
- [**Changelog**](CHANGELOG.md) · [**Contributing**](CONTRIBUTING.md) · [**Code of Conduct**](CODE_OF_CONDUCT.md)

## Contributing

Issues and PRs welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for the dev setup and the verify gate, and [SECURITY.md](SECURITY.md) for reporting a secret leak privately. Good first additions: more cleanup-command coverage, richer usage-trend views, and broader plugin-marketplace detection.

## License

MIT — see [LICENSE](LICENSE). A [Bespoke Woodcraft Studio](https://github.com/BespokeWoodcraftStudio) tool. Not affiliated with Anthropic; "Claude" and "Claude Code" are trademarks of Anthropic.
