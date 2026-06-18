# FAQ

Short answers to the questions people ask most. If something here is unclear, see [SUPPORT.md](../SUPPORT.md) for where to ask.

## Is anything uploaded?

No. The scan runs on your machine and never makes a network request. The web app parses your `claude-inventory.json` in the browser and keeps it only in that browser's `localStorage`. Nothing is sent to a server — there is no server. Close the tab and the data stays on your machine.

## What exactly does the scan read?

It reads your Claude Code setup: skills, plugins, MCP servers, and agents. It pulls from the usual places — `SKILL.md` frontmatter for skills, `*.md` files for agents, `installed_plugins.json` for plugins, and `~/.claude.json` plus per-project `.mcp.json` for MCP servers.

It also reads your local **transcripts** (`~/.claude/projects/*.jsonl`) to count how often each skill, agent, and MCP server was actually invoked — but **only** the names, counts, and timestamps, never prompt or message contents. See [How does it know what I actually use?](#how-does-it-know-what-i-actually-use) for the privacy details and the `--no-transcripts` opt-out.

It enumerates **every project** Claude Code knows about (from `~/.claude.json`), not just the folder you run it in. So one scan gives you your whole picture, global and per-project.

## Can it delete or change anything?

No. The scan only reads. It never installs, modifies, or removes anything.

The cleanup features only **generate text** — a paste-to-Claude prompt, a shell script, or JSON. You read those commands and run them yourself if you want to. The tool never touches your files.

## Are my API keys / secrets safe?

The known secret-bearing fields are redacted before `claude-inventory.json` is written:

- MCP `env` values
- auth headers
- credentials and query strings in URLs
- token-looking command arguments

Each becomes `<redacted>`. Your home directory is rewritten to `~`, so your username never leaks.

There is **one caveat**: skill and agent descriptions are prose copied from their frontmatter. We run a best-effort scrub over them (obvious token shapes like `sk-…` and `ghp_…` are redacted), but it's not a guarantee — don't keep secrets in a `SKILL.md` or agent description. If you ever spot an unredacted secret in your output, see [SECURITY.md](../SECURITY.md) — rotate the credential first, then report it privately.

## Do I need a GitHub account or to know the terminal?

No. The [Setup page](https://claude-inventory-tool.vercel.app/setup) is a copy-paste wizard. You copy one line, paste it into your terminal, press Enter, and drop the resulting file into the tool. No GitHub account, no coding.

## How does it know what I actually use?

The scan reads your local Claude Code **transcripts** — the session logs under `~/.claude/projects/*.jsonl` — and counts how many times each skill, agent, and MCP server was actually invoked, along with the most recent time each was used. That's what powers the "installed but never used" signal, and it works even for MCP servers and agents, which carry no usage count in plain config.

It reads **only the names** (the tool / skill / agent / MCP-server name), the **counts**, and the **timestamps**. It never reads or records your prompts, message text, tool arguments, file paths, `cwd`, or command contents. The transcript files are streamed line by line and only those few fields are extracted.

Everything stays on your machine; the counts land in `claude-inventory.json` and go nowhere until *you* choose to upload that file to the web app (which still parses it only in your browser).

Don't want the scan to look at transcripts at all? Run it with `--no-transcripts`. You'll still get the full inventory — just without the per-item invocation counts for skills, agents, and MCP servers.

## Where is the file saved?

In the folder your terminal was in when you ran the scan. The scanner prints the exact path with a `✓` when it finishes — trust that line. If you can't find the file, it's almost always sitting in your home folder or wherever the terminal opened to.

## Does this work on Windows?

Yes. The [Setup page](https://claude-inventory-tool.vercel.app/setup) gives you a Windows-specific command to copy. The scanner is plain Node and runs the same on Windows, macOS, and Linux.

## I don't trust "curl | node" — what else can I do?

That's a healthy instinct. You have options, lightest-touch first:

- **Use npx — no pipe, no curl.** Run `npx claude-inventory-tool`. npm fetches the published, versioned package and runs it. It's the same code as `/scan.mjs`, just delivered through npm instead of a shell pipe.
- **Download and read it first.** Save `scan.mjs` to disk, open it, read it (it's one short, dependency-free file), then run `node scan.mjs`.
- **Clone the repo and run it from source.** `git clone`, then `node public/scan.mjs`.

Either way you run the exact same code, just after you've looked at it.

## Is this affiliated with Anthropic?

No. It's a [Bespoke Woodcraft Studio](https://github.com/BespokeWoodcraftStudio) tool, not an Anthropic product. "Claude" and "Claude Code" are trademarks of Anthropic.

## Is it really free / open source?

Yes. It's free and open source under the MIT license. The full source is on [GitHub](https://github.com/BespokeWoodcraftStudio/claude-inventory-tool) — read it, run it, fork it, or self-host your own copy.
