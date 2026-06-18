# Support

Need a hand? Here's where to go.

- **Found a bug?** Open a [GitHub issue](https://github.com/BespokeWoodcraftStudio/claude-inventory-tool/issues). Tell us what you ran, what you expected, and what happened — and your OS and Node version (`node --version`) help a lot.
- **Have a question?** Start a [GitHub Discussion](https://github.com/BespokeWoodcraftStudio/claude-inventory-tool/discussions), or email [info@pixelventuresllc.com](mailto:info@pixelventuresllc.com). For conceptual questions ("what counts as a project?", "why is this passive?"), the [FAQ](docs/FAQ.md) probably has it.
- **Found a security problem — especially a real secret that landed in `claude-inventory.json`?** Do **not** open a public issue. Follow [SECURITY.md](SECURITY.md): rotate the exposed credential first, then report it privately through the repo's Security tab ("Report a vulnerability") or by email. A leaked secret must never go in a public issue.

If you'd like to help fix something rather than just report it, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Troubleshooting

Most snags happen at the scan step. Here are the ones we see, with the cause and the fix.

### "node: command not found" / "'node' is not recognized"

**Cause:** Node isn't installed, or you installed it but didn't reopen the terminal so it isn't on your PATH yet.

**Fix:** Install Node from [nodejs.org](https://nodejs.org) (the "LTS" download is the right one), then **fully close and reopen your terminal** and run the scan again. Check it took with `node --version` — you should see a version number. If you use Claude Code, you already have Node; reopening the terminal usually solves it.

### The scan command errors in Windows PowerShell

**Cause:** On Windows, `curl` in PowerShell is an alias for a different command and chokes on the one-liner from the README.

**Fix:** Use `curl.exe` (with the `.exe`) so you get the real curl:

```powershell
curl.exe -fsSL https://claude-inventory-tool.vercel.app/scan.mjs -o claude-inventory-scan.mjs ; node claude-inventory-scan.mjs
```

If that still gives you trouble, the [Setup page](https://claude-inventory-tool.vercel.app/setup) walks you through it copy-paste by copy-paste, with the Windows commands spelled out.

### "That isn't valid JSON" / "Couldn't read that inventory file" in the app

**Cause:** The whole file didn't make it in. Usually only part of `claude-inventory.json` was copied, or a screenshot was pasted instead of the file's contents.

**Fix:** Re-run the scan and grab the **entire** `claude-inventory.json` — every character from the opening `{` to the closing `}`. The easiest path is to drop the file itself into the app rather than copy-pasting its text. A screenshot can't be read; the tool needs the JSON.

### "My inventory looks empty" / "a project is missing"

**Cause:** The scan reads the list of projects from `~/.claude.json`. A repo that Claude Code has never opened won't be in that list, so it won't appear.

**Fix:** Open the missing repo in Claude Code and run a short session there once, **or** run the scan from inside that folder (`cd` into it first, then run the scan). Then re-run and re-drop the file. If *everything* looks empty, you likely haven't used Claude Code on this machine yet — there's simply nothing to inventory.

### "I can't find claude-inventory.json"

**Cause:** The file is saved in whatever folder your terminal was sitting in when you ran the scan — not a fixed location.

**Fix:** Trust the printed `✓` path. When the scan finishes it prints the full path it wrote to (something like `✓ wrote ~/claude-inventory.json`). Open that exact folder. If you're not sure where your terminal was, the scan's last line tells you.

### "curl can't reach the script"

**Cause:** A network, firewall, or proxy is blocking the download from `claude-inventory-tool.vercel.app`.

**Fix (easiest):** Skip `curl` entirely and run the published package through npm:

```bash
npx claude-inventory-tool
```

If npm is also blocked or you'd rather not hit the network at all, self-host the scanner straight from the source:

```bash
git clone https://github.com/BespokeWoodcraftStudio/claude-inventory-tool
cd claude-inventory-tool
node public/scan.mjs
```

Both run the same scan and write the same `claude-inventory.json`.

### "My data disappeared"

**Cause:** The app keeps your loaded inventory only in **this browser's** `localStorage` — nothing is uploaded or saved server-side. Clearing site data, using private/incognito mode, or switching to a different browser or profile starts you fresh.

**Fix:** Just re-drop your `claude-inventory.json` into the app. (If you still have the file, you're set. If not, re-run the scan — it's instant.)

---

Still stuck? Open a [Discussion](https://github.com/BespokeWoodcraftStudio/claude-inventory-tool/discussions) or email [info@pixelventuresllc.com](mailto:info@pixelventuresllc.com). For the bigger picture, see [docs/USAGE.md](docs/USAGE.md) and [docs/FAQ.md](docs/FAQ.md); for anything secret-related, [SECURITY.md](SECURITY.md).
