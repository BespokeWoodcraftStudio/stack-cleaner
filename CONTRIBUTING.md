# Contributing

Thanks for being here. This is a small, friendly project with one job: help people see and tidy up their Claude Code setup, without ever leaking a secret in the process. Issues and pull requests are welcome — whether you're fixing a typo, sharpening a redaction rule, or adding a whole new captured field. You don't need to be an expert to help; you just need to care about the same two things we do: keeping the tool honest about privacy, and keeping it pleasant to use.

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Local setup

It's a standard Next.js (App Router) app — no backend, no database.

```bash
git clone https://github.com/BespokeWoodcraftStudio/claude-inventory-tool
cd claude-inventory-tool
npm install
npm run dev        # http://localhost:3000

# scan your own machine straight from the source:
node public/scan.mjs        # or: npm run scan
```

## How the project is laid out

The README has the full [**Project layout**](README.md#project-layout) section. The short version, and the mental model to keep:

- **`public/scan.mjs` is the engine.** It's a zero-dependency Node script (`node:` built-ins only) that runs on the user's machine, reads their Claude Code install, strips secrets, and writes `claude-inventory.json`.
- **The web app is a pure client-side viewer.** It parses that file in the browser and stores it only in `localStorage`. There is no server, nothing is uploaded, and nothing is ever installed or removed by the tool — cleanup features only *generate* text commands for the user to review and run.

The schema that ties the two halves together lives in [`lib/types.ts`](lib/types.ts), and the parse/filter/group/export logic is in [`lib/inventory.ts`](lib/inventory.ts).

## Adding a captured field

If you want the inventory to record something new about each item, it's a three-step change, in this order:

1. **`lib/types.ts`** — add the field to the `InventoryItem` interface (and bump `SCHEMA_VERSION` if the shape changes in a breaking way).
2. **`public/scan.mjs`** — emit the field when the scanner builds each item.
3. **`lib/inventory.ts`** — read and validate the field in `parseInventory`.

Keep the emitter and the parser in sync; a field the scan writes but the app ignores (or vice versa) is a bug.

## The verify gate

Every PR must pass these three checks. Run them locally before you open the PR — they're the same checks a reviewer will run.

**1. The build must be green (types included).**

```bash
npm run build
```

TypeScript is type-checked during the build, so a green build means the types are sound too.

**2. The scan output must contain no secrets and no absolute home path.**

Run the scanner against your own machine and grep its output. Every one of these patterns must return **zero** matches:

```bash
node public/scan.mjs --stdout | grep -nE '/Users/|sk-|gh[pousr]_|xox|AKIA|[A-Za-z0-9_-]{40,}'
```

That's checking for: absolute `/Users/<name>/` paths, OpenAI-style keys (`sk-`), GitHub tokens (`ghp_`/`gho_`/`ghu_`/`ghs_`/`ghr_`), Slack tokens (`xox…`), AWS access keys (`AKIA…`), and any long token-looking string. The scan output must **never** contain a real secret or an absolute home path.

**3. Responsive check at 1280px and 375px.**

Eyeball all three routes — `/`, `/setup`, and `/inventory` — at both 1280px (desktop) and 375px (phone). There must be no horizontal **page** overflow at either width. (Codeblocks may scroll inside their own box; the page itself must not.) No clipped or overlapping text.

## Security invariant (any PR that touches `scan.mjs`)

This is the line we don't cross. If your change touches `public/scan.mjs` — or anything in the redaction path — treat the following as a hard requirement, not a nice-to-have:

- **The scan output must never contain a real secret** (MCP `env` values, auth headers, URL credentials and query strings, token-looking command arguments — all of these must be replaced with `<redacted>`), **and never an absolute `/Users/<name>/` path** (the home directory is rewritten to `~`).
- **No real secrets in test fixtures or committed sample output.** If you add a fixture or example inventory, use obviously fake placeholder values, and make sure any real scan output you might paste into a PR has been run through the grep above first.
- One documented caveat already exists: skill and agent **descriptions** are copied verbatim from frontmatter and are *not* scrubbed. If your change widens what gets copied verbatim, call it out explicitly in the PR.

If you find a case where a real secret reached `claude-inventory.json`, **do not open a public issue** — see [SECURITY.md](SECURITY.md) and report it privately.

## Branch & PR etiquette

- **Keep PRs small and focused.** One change per PR is much easier to review (and to revert) than a grab-bag.
- **Describe the change** — what it does, and why. If you changed behavior, say so plainly.
- **Link the issue** it closes or relates to.
- Work on a branch, not `main`.

## Changelog

If your change is **user-facing** (anything someone using the tool would notice) or touches a **redaction rule**, add an entry to [CHANGELOG.md](CHANGELOG.md) in the same PR. Internal refactors with no observable effect don't need one.

## Where to discuss ideas

Open a [GitHub issue](https://github.com/BespokeWoodcraftStudio/claude-inventory-tool/issues) to propose or talk through an idea before you build it — especially for anything that changes the schema or the redaction rules. Not sure where to start? Read [docs/FAQ.md](docs/FAQ.md) and [docs/USAGE.md](docs/USAGE.md) first; for help using the tool, see [SUPPORT.md](SUPPORT.md).

## Good first issues

A few additions we'd genuinely like, sized for a first contribution:

- **More cleanup-command coverage** — additional `removeCmd` shapes in `deriveRemoveCmd` (`lib/inventory.ts`) and the per-type commands in `scan.mjs`.
- **Richer usage views** — the transcript scan already records invocation counts and last-used timestamps; surfacing trends (e.g. "used a lot last month, nothing since") would build on that.
- **Broader plugin-marketplace detection** — recognizing more install layouts in the plugin scan.

(Two earlier asks — transcript-derived usage for MCP servers and agents, and an `npx` entry point for the scanner — have since shipped; see [CHANGELOG.md](CHANGELOG.md).)

When you open a PR, fill out the [pull request template](.github/PULL_REQUEST_TEMPLATE.md) — it's just the verify gate in checklist form.
