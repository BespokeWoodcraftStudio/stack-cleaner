# Security Policy

The whole pitch of this tool is that **secrets are stripped before anything leaves your machine**. So a redaction miss is the most serious bug we can have. If you find one, we want to hear about it — quietly, and quickly.

This document explains how to report a problem, what counts as in scope, and what we already do to protect you.

## How to report a vulnerability

Please use a **private** channel. Do not open a public GitHub issue for a security problem — especially not one that includes a leaked secret.

Two ways, in order of preference:

1. **GitHub private advisory (preferred).** Go to the repo's **Security** tab → **Report a vulnerability**. This opens a private security advisory that only the maintainer can see.
2. **Email.** Write to **info@pixelventuresllc.com**.

That's it. There are no other contacts — if you see an address like `security@…` somewhere, it isn't ours.

## The #1 issue: a secret reached `claude-inventory.json`

The most important thing to report is this:

> The scanner wrote a **real secret**, or an absolute **`/Users/<name>/`** path, into `claude-inventory.json`.

The output file should never contain a real credential or your real home-directory path. If yours does, that's the bug we most need to fix.

Before you report, please do two things:

1. **Rotate the exposed credential first.** Treat any secret that landed in the file as compromised. Revoke or roll it before doing anything else — the file may have been copied, synced, or backed up without you noticing.
2. **Send a redacted reproduction — never the raw secret.** Show us the *shape* of the config that slipped through, with the secret value removed. For example:

   ```jsonc
   // The config shape that leaked — value replaced with a placeholder:
   {
     "mcpServers": {
       "example": {
         "command": "some-cli",
         "args": ["--key", "<REDACTED-32-char-secret-was-here>"]
       }
     }
   }
   ```

   We can fix the redaction rule from the shape alone. We do not need — and do not want — your real secret.

## What to include in a report

A good report tells us enough to reproduce the miss without exposing you:

- **OS** (e.g. macOS 15, Ubuntu 24.04, Windows 11).
- **Node version** (`node --version`).
- **The scanner version** — the `generator` field in your JSON (e.g. `scan.mjs@1.0.0`).
- **Which redaction rule should have caught it** — env value, auth header, URL credential or query string, token-looking argument, or the home-directory rewrite.
- The **redacted** config shape that slipped through (see above).

## Scope

**Out of scope: server-side vulnerabilities.** There is no backend and no database. The scan runs locally and the web app parses your file in your browser. So classic server bugs (SQL injection, SSRF, auth bypass, and so on) don't apply here.

**In scope:**

- **Redaction misses** — a real secret or a `/Users/<name>/` path reaching `claude-inventory.json`. This is the top priority.
- **Client-side issues** — for example, XSS or other injection via a crafted inventory file that the app parses in the browser.
- **Supply-chain trust of the `curl … | node` one-liner** — anything that could let the scan you run differ from the published, auditable `public/scan.mjs`.

## Response expectations

This is a volunteer, open-source project, so responses are best-effort. We aim to **acknowledge a report within a few days**. Redaction misses get triaged first. We'll keep you posted as we work on a fix, and we're glad to credit you once it ships (or to keep you anonymous — your call).

## What we already do

A quick reassurance, since the output describes your tooling:

- The scan **runs entirely on your machine** and makes **zero network calls**.
- The web app **parses your file in the browser** and stores it only in that browser's `localStorage` — it is never uploaded.
- **Secrets are redacted before the file is written**: MCP `env` values, auth headers, URL credentials and query strings, and token-looking command arguments are replaced with `<redacted>`.
- Your **home directory is rewritten to `~`**, so your username doesn't leak.

One documented caveat: skill and agent **descriptions** are prose copied from frontmatter. We do run a best-effort scrub over them (obvious token shapes like `sk-…`, `ghp_…`, and `Authorization: …` are redacted), but that pass is not a guarantee — so don't keep secrets in a `SKILL.md` or agent description.

## How transcripts are handled

To compute real usage counts, the scan reads your local Claude Code transcripts (`~/.claude/projects/*.jsonl`). This is deliberately narrow:

- **Names, counts, and timestamps only.** The scanner streams each transcript line by line and extracts **only** the tool / skill / agent / MCP-server name, increments a counter, and keeps the most recent timestamp. That's all that reaches `claude-inventory.json`.
- **What it never reads or emits.** It does not read or record your prompts, message or response text, tool arguments, `cwd`, file paths or file contents, or `Bash` command text. None of that is parsed out of the transcript, so none of it can leak into the output.
- **Local until you upload.** Like the rest of the scan, this happens entirely on your machine and makes no network call. The counts only leave your device if you choose to upload `claude-inventory.json` to the web app (which still parses it only in your browser).
- **Opt out completely.** Run the scan with **`--no-transcripts`** to skip the transcript read entirely. You'll still get the full inventory, just without per-item invocation counts.

If you find the transcript pass emitting anything beyond names, counts, and timestamps, treat it as a redaction miss and report it privately using the steps above.

For more, see the [Privacy & safety](README.md#privacy--safety) section of the README and [docs/FAQ.md](docs/FAQ.md). Related docs: [CONTRIBUTING.md](CONTRIBUTING.md), [SUPPORT.md](SUPPORT.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), [CHANGELOG.md](CHANGELOG.md), and [docs/USAGE.md](docs/USAGE.md).
