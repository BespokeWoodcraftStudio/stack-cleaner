# Using the inventory tool

This is a walkthrough of the tool itself — reading the inventory, finding the dead
weight, and building a cleanup plan. You don't need to scan anything first: the tool
ships with a built-in demo dataset you can poke at right away.

If you *do* want to point it at your own setup, that's the two-step flow in the
[README](../README.md), and the guided, no-terminal version lives at
[`/setup`](https://claude-inventory-tool.vercel.app/setup). This page assumes the file
is already there (or you're on demo data) and focuses on what the screen does.

---

## 1. Open the tool with demo data

Go to [`/inventory`](https://claude-inventory-tool.vercel.app/inventory).

If you've never loaded your own file, it opens on the demo automatically — a real,
hand-curated Claude Code inventory so the screen is never empty. A "Demo" banner sits
at the top. If you'd loaded a file before and want the sample back, click
**Try the demo** (in the upload panel) or **Reset to demo** (top right). Either one
also clears any stored inventory — see [persistence](#persistence) below.

Nothing here is uploaded. The demo and any file you load are parsed in your browser.

---

## 2. Read the layout

The page is three things stacked top to bottom: a stat strip, a filter row, and the
items themselves grouped by where they live.

### The stat strip

Five tiles across the top: **total items**, **global**, **project**, **actively used**,
and **unused**. They're not just numbers — each one is a button. Click **unused** to
jump straight to the dead weight; click **global** to see only user-level items; click
**total items** to clear every filter and start over.

### Global vs. project grouping

Below the filters, items are grouped by scope:

- **Global** — everything in `~/.claude` (and your `~/.claude.json` MCP servers and
  plugins). These apply to every project on your machine.
- **Project** — items that live inside a single repo's `.claude` folder. Each project
  gets its own section, labeled with the project name.

This split is the whole point: it's how you tell "I installed this once, everywhere"
from "this is scoped to one repo." Every row carries a colored type badge
(**skill**, **plugin**, **mcp**, **agent**), its description, and any overlap note
("↳ also: …") flagging a duplicate elsewhere in your setup.

### Usage badges

The badge on the right of each row is the signal you're hunting by. There are five:

| Badge | Class | What it means |
|-------|-------|---------------|
| **Used** | `good` | It has real usage — a live invocation count from your transcripts (skills, agents, MCP servers) or Claude Code's own tables (skills, plugins). Keep it. |
| **Unused (recent)** | `warn` | No usage yet, but it might be new. Look before you delete — it could just be freshly installed. |
| **Unused** | `bad` | No usage and not recent. The prime candidate for removal. |
| **Passive** | `info` | Works through a hook or is always-on, so a usage count doesn't apply. Not dead — just silent. |
| **No signal** | `unknown` | No usage data at all — e.g. you scanned with `--no-transcripts`, or nothing in your transcripts matched this item. |

The exact label often shows the raw count from your setup ("✅ 461 calls", "⚠️ never"),
but the underlying class is one of the five above. "Unused" and "Unused (recent)" are
what the tool counts together as **unused** in the stat strip and filters.

### Where the usage signal comes from

Those counts are **real invocations**, not guesses. When you scan, the script streams your
local Claude Code transcripts (`~/.claude/projects/*.jsonl`) and tallies how many times each
skill, agent, and MCP server was actually called, plus the most recent time you used each.
That's what lets the tool flag the thing you *installed but never used* — and it works for MCP
servers and agents too, which carry no usage count in plain config. (Skills and plugins also
keep their counts from Claude Code's own `skillUsage` / `pluginUsage` tables.)

The transcript read extracts **only** the tool / skill / agent / MCP-server names, the counts,
and the timestamps — never your prompts, message text, tool arguments, file paths, or command
contents. Nothing leaves your machine; the counts go into `claude-inventory.json` and stay there
until you choose to upload the file.

If you'd rather not have the scan read your transcripts at all, run it with **`--no-transcripts`**:

```bash
npx claude-inventory-tool --no-transcripts
# or, from a downloaded script:  node claude-inventory-scan.mjs --no-transcripts
```

You'll still get the full inventory — just without the per-item invocation counts, so skills,
agents, and MCP servers fall back to the **No signal** badge.

---

## 3. Filter and search for dead weight

The filter row narrows the list four ways. They stack — combine them freely.

1. **Search** — type into the search box to match a name, description, or overlap note.
   Good for "show me everything SEO" or finding one item by name.
2. **Scope** — **All scopes / Global / Project** chips. Each shows its count. When the
   loaded inventory has more than one project, a project dropdown appears next to them so
   you can isolate a single repo.
3. **Type** — **All types**, then one chip per type (**Skills / Plugins / MCP servers /
   Agents**), each with a count.
4. **Usage** — **Any usage / Used / Unused / Passive**. Pick **Unused** to surface only
   the `bad` + `warn` rows.

A line under the filters tells you "X of Y items" so you always know how much the view
is hiding. To find dead weight fast: click the **unused** stat tile (or the **Unused**
usage chip), and skim. The overlap notes ("↳ also: …") are worth reading here — they're
where you'll spot two installs of the same thing.

If a filter combination matches nothing, you'll get a "Nothing matches these filters"
card with a **Reset filters** button.

---

## 4. Tick the items you want gone

Each row has a checkbox. Tick it and the row name gets a strikethrough, the row tints,
and its exact removal command appears inline (with a copy button) so you can see what
*would* run before committing to anything.

You don't have to click one at a time:

- **Select unused in view** (top right of the list) ticks every `bad`/`warn` item that
  the current filters are showing — so you can scope it first, then bulk-select.
- **Select N unused** sits on each group's header and selects just that group's unused
  items.
- **Clear all** unticks everything.

Selections are remembered as you filter — narrowing the view doesn't drop what you've
already picked.

---

## 5. Open the cleanup drawer and pick an export

As soon as anything is selected, a **sticky drawer** slides up at the bottom of the
screen showing "N selected for removal." It stays pinned while you scroll. Use **Hide
cleanup plan** to collapse it, **Clear selection** to empty it.

The drawer has three export formats — pick the chip that matches how you want to do the
removals:

- **Hand to Claude** — a prompt you paste back into Claude Code. Claude reads your
  selection and does the removals for you. Best if you'd rather not run commands by hand.
- **Shell script** — the exact commands (`claude plugins uninstall …`,
  `rm -rf ~/.claude/skills/…`, `claude mcp remove …`, `git rm …`), grouped by type, for
  you to **review and run yourself**. Best if you want to read every line first.
- **JSON** — the raw selection, machine-readable, for your own tooling.

Each format has a **Copy** button and a **Download** button (saving
`claude-cleanup-prompt.txt`, `claude-cleanup.sh`, or
`claude-inventory-selection.json`).

---

## 6. Nothing is removed by the tool

Worth saying plainly: this tool never deletes, uninstalls, or modifies anything. The
scan only reads, and the cleanup drawer only **generates text** — a prompt, a script, or
JSON — for you to review and run. You stay in control of every actual change. If you copy
the shell script, read it before you run it; if you hand the prompt to Claude, you still
approve what it does.

---

## Persistence

Once you load your own `claude-inventory.json`, it's saved to this browser's
`localStorage` so it survives a refresh — and your selection is saved too. It is never
uploaded; it lives only on this device. **Reset to demo** (or **Try the demo**) clears
that stored inventory and selection and drops you back on the sample data. Clearing your
browser storage does the same thing.

---

## Related

- [README.md](../README.md) — what the tool is and the scan one-liner.
- [docs/FAQ.md](FAQ.md) — common questions.
- [SECURITY.md](../SECURITY.md) — redaction, and how to report a leak.
- [CONTRIBUTING.md](../CONTRIBUTING.md) — adding fields, the verify gate.
