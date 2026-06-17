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

```bash
curl -fsSL https://claude-inventory-tool.vercel.app/scan.mjs | node
```

Prefer to read it first? It's one short, dependency-free file ([`public/scan.mjs`](public/scan.mjs)) — download then run:

```bash
curl -fsSL https://claude-inventory-tool.vercel.app/scan.mjs -o claude-inventory-scan.mjs
node claude-inventory-scan.mjs
```

**Not comfortable in a terminal?** The [**Setup page**](https://claude-inventory-tool.vercel.app/setup) walks you through it copy-paste by copy-paste. You never need a GitHub account or any coding.

## What it captures

For every item it records the type, the scope (global or which project), a description, and a usage signal:

| Type | Global source | Project source |
|------|---------------|----------------|
| **Skills** | `~/.claude/skills/*/SKILL.md` | `<repo>/.claude/skills/*/SKILL.md` |
| **Plugins** | `~/.claude/plugins/installed_plugins.json` | — |
| **MCP servers** | `~/.claude.json` → `mcpServers` | per-project `mcpServers` + `.mcp.json` |
| **Agents** | `~/.claude/agents/*.md` | `<repo>/.claude/agents/*.md` |

It enumerates **every project** Claude Code knows about (from `~/.claude.json`), not just the folder you run it in — so you get your whole picture in one pass. Usage counts come from Claude Code's own `skillUsage` / `pluginUsage` tables.

## Privacy & safety

This is the part that matters, because the output describes your tooling.

- **Runs entirely on your machine.** The scan never makes a network request. The web app parses your file in the browser and stores it only in that browser's `localStorage` — it is never uploaded.
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

Deploy your own copy to Vercel (or any static-capable Next host) with one click of "Import Project" — there's nothing to configure.

## The inventory schema

The scan emits, and the app reads, a single JSON shape ([`lib/types.ts`](lib/types.ts)):

```jsonc
{
  "schemaVersion": 1,
  "generatedAt": "2026-…",
  "generator": "scan.mjs@1.0.0",
  "projects": ["my-app", "my-blog"],
  "items": [
    {
      "id": "skill:global:graphify",
      "type": "skill",            // skill | plugin | mcp | agent
      "scope": "global",          // global | project
      "project": null,            // basename for project-scoped items
      "name": "graphify",
      "description": "…",
      "usageCount": 10,
      "usageClass": "good",       // good | warn | bad | info | unknown
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

## Contributing

Issues and PRs welcome. Good first additions: deriving MCP/agent usage from transcripts, an `npx` entry point for the scanner, and more cleanup-command coverage.

## License

MIT — see [LICENSE](LICENSE). A [Bespoke Woodcraft Studio](https://github.com/BespokeWoodcraftStudio) tool. Not affiliated with Anthropic; "Claude" and "Claude Code" are trademarks of Anthropic.
