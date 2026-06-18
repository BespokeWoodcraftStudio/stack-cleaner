#!/usr/bin/env node
// claude-inventory-tool — npx CLI
//
// Scans your local Claude Code setup (skills, plugins, MCP servers, agents)
// plus transcript usage, and writes a redacted claude-inventory.json you can
// upload to https://claude-inventory-tool.vercel.app to explore + clean up.
//
//   npx claude-inventory-tool
//   npx claude-inventory-tool --stdout
//   npx claude-inventory-tool --out my-inventory.json
//
// Privacy: only tool/server/agent/skill NAMES, counts, and timestamps are
// extracted from transcripts. No prompt text, args, paths, or commands.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { runScan } from "../public/scan.mjs";

const UPLOAD_URL = "https://claude-inventory-tool.vercel.app";
const __dirname = dirname(fileURLToPath(import.meta.url));

function readVersion() {
  try {
    const pkgPath = resolve(__dirname, "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function printHelp() {
  const v = readVersion();
  process.stdout.write(
    `claude-inventory-tool v${v}

Scan your local Claude Code setup (skills, plugins, MCP servers, agents) and
transcript usage into a redacted claude-inventory.json. Then upload it to
${UPLOAD_URL} to explore and clean up what you're not using.

Usage:
  npx claude-inventory-tool [options]

Options:
  -h, --help               Show this help and exit.
  -v, --version            Print the version and exit.
      --stdout, --print    Print the inventory JSON to stdout instead of writing a file.
      --out <file>         Write the inventory to <file> (default: claude-inventory.json).
      --no-transcripts     Skip transcript usage scanning (faster; no usage counts).
      --transcripts-dir <dir>
                           Scan transcripts from <dir> instead of ~/.claude/projects.

Examples:
  npx claude-inventory-tool
  npx claude-inventory-tool --stdout > inventory.json
  npx claude-inventory-tool --out ~/Desktop/inventory.json
  npx claude-inventory-tool --no-transcripts

Privacy: only tool/server/agent/skill names, counts, and timestamps are read
from transcripts — never prompt text, arguments, file paths, or commands.

After scanning, upload the JSON at ${UPLOAD_URL}.
`
  );
}

function parseArgs(argv) {
  const opts = {
    help: false,
    version: false,
    stdout: false,
    outFile: "claude-inventory.json",
    transcripts: true,
    transcriptsDir: undefined,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "-h":
      case "--help":
        opts.help = true;
        break;
      case "-v":
      case "--version":
        opts.version = true;
        break;
      case "--stdout":
      case "--print":
        opts.stdout = true;
        break;
      case "--no-transcripts":
        opts.transcripts = false;
        break;
      case "--out": {
        const next = argv[++i];
        if (next === undefined) {
          throw new Error("--out requires a file path");
        }
        opts.outFile = next;
        break;
      }
      case "--transcripts-dir": {
        const next = argv[++i];
        if (next === undefined) {
          throw new Error("--transcripts-dir requires a directory path");
        }
        opts.transcriptsDir = next;
        break;
      }
      default:
        // Support --out=file / --transcripts-dir=dir style too.
        if (arg.startsWith("--out=")) {
          opts.outFile = arg.slice("--out=".length);
        } else if (arg.startsWith("--transcripts-dir=")) {
          opts.transcriptsDir = arg.slice("--transcripts-dir=".length);
        } else {
          throw new Error(`Unknown option: ${arg}`);
        }
    }
  }

  return opts;
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`Error: ${err.message}\n\n`);
    process.stderr.write(`Run \`claude-inventory-tool --help\` for usage.\n`);
    process.exit(1);
    return;
  }

  if (opts.help) {
    printHelp();
    return;
  }

  if (opts.version) {
    process.stdout.write(`${readVersion()}\n`);
    return;
  }

  // Friendly banner — keep it on stderr so `--stdout` stays pure JSON on stdout.
  if (!opts.stdout) {
    process.stderr.write(`claude-inventory-tool v${readVersion()}\n`);
    process.stderr.write(`Scanning your Claude Code setup...\n`);
  }

  try {
    await runScan({
      stdout: opts.stdout,
      outFile: opts.outFile,
      transcripts: opts.transcripts,
      transcriptsDir: opts.transcriptsDir,
    });
  } catch (err) {
    process.stderr.write(`\nScan failed: ${err && err.message ? err.message : err}\n`);
    process.exit(1);
    return;
  }

  // Next-step guidance (skip when piping JSON to stdout so we don't pollute it).
  if (!opts.stdout) {
    process.stderr.write(
      `\nNext step:\n` +
        `  1. Open ${UPLOAD_URL}\n` +
        `  2. Upload the ${opts.outFile} file to explore and clean up your setup.\n`
    );
  }
}

main().catch((err) => {
  process.stderr.write(`\nUnexpected error: ${err && err.message ? err.message : err}\n`);
  process.exit(1);
});
