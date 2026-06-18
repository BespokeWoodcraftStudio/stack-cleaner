#!/usr/bin/env node
// =============================================================
// Claude Inventory Tool — local scan
//
//   curl -fsSL https://claude-inventory-tool.vercel.app/scan.mjs | node
//   # or:  node scan.mjs            (writes ./claude-inventory.json)
//          node scan.mjs --stdout   (prints JSON to stdout instead)
//
// Reads your local Claude Code install and writes a single JSON file
// describing every skill, plugin, MCP server, and agent you have — split
// by global (~/.claude) vs. project (each repo's .claude). Drop that file
// into the web app to see and organize everything.
//
// It also scans your local Claude Code transcripts (~/.claude/projects/*.jsonl)
// to count how often each skill, agent, and MCP server was actually invoked,
// and when it was last used. ONLY tool/server/agent/skill NAMES, counts, and
// timestamps are read from transcripts — never your prompts, messages, command
// text, file paths, or tool arguments. Disable with --no-transcripts.
//
// PRIVACY: this runs entirely on your machine. It never sends anything
// anywhere. Secrets are aggressively redacted before they ever touch the
// output file: MCP env values, auth headers, tokens, and URL credentials
// are replaced with "<redacted>". Your home directory is rewritten to "~".
// Skill/agent descriptions are prose blurbs copied from their frontmatter; we
// also scrub obvious token shapes (sk-…, ghp_…, "Authorization: …") out of them,
// but that pass is best-effort — don't keep secrets in a SKILL.md description.
// Read this file before you run it — it's short and has no dependencies.
//
// SPDX-License-Identifier: MIT
// =============================================================

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import readline from "node:readline";
import { pathToFileURL } from "node:url";

const SCHEMA_VERSION = 1;
const GENERATOR = "scan.mjs@1.1.3";
const HOME = os.homedir();
const CLAUDE = path.join(HOME, ".claude");

// ---------- small helpers ----------
const tilde = (p) => (p && p.startsWith(HOME) ? "~" + p.slice(HOME.length) : p);
const exists = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };
const readText = (p) => { try { return fs.readFileSync(p, "utf8"); } catch { return null; } };
const readJSON = (p) => { const t = readText(p); if (!t) return null; try { return JSON.parse(t); } catch { return null; } };
const listDir = (p, kind) => {
  try {
    return fs.readdirSync(p, { withFileTypes: true })
      .filter((d) => (kind === "dir" ? d.isDirectory() : d.isFile()))
      .map((d) => d.name);
  } catch { return []; }
};

// Pull `name:` and `description:` out of YAML-ish frontmatter without a YAML dep.
// Handles single-line scalars, quoted values, and block scalars (`>`, `>-`, `|`,
// `|-`) — the conventional way skills write their long, multi-line descriptions.
function parseFrontmatter(text) {
  if (!text) return {};
  const m = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out = {};
  const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let v = kv[2].trim();

    // Block scalar: `>` (folded → spaces) or `|` (literal → newlines), with an
    // optional chomp indicator and trailing comment. The body is the following
    // more-indented lines, ending at the first line dedented to the key or less.
    const block = v.match(/^([|>])[+-]?\s*(?:#.*)?$/);
    if (block) {
      const folded = block[1] === ">";
      const keyIndent = (line.match(/^(\s*)/) || ["", ""])[1].length;
      const body = [];
      let j = i + 1;
      for (; j < lines.length; j++) {
        if (lines[j].trim() === "") { body.push(""); continue; }
        const ind = (lines[j].match(/^(\s*)/) || ["", ""])[1].length;
        if (ind <= keyIndent) break;
        body.push(lines[j]);
      }
      const firstContent = body.find((b) => b.trim() !== "") || "";
      const baseIndent = (firstContent.match(/^(\s*)/) || ["", ""])[1].length;
      const stripped = body.map((b) => b.slice(baseIndent));
      while (stripped.length && stripped[stripped.length - 1].trim() === "") stripped.pop();
      out[key] = folded ? stripped.join(" ").replace(/\s+/g, " ").trim() : stripped.join("\n");
      i = j - 1;
      continue;
    }

    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[key] = v;
  }
  return out;
}

// ---------- secret redaction ----------
const SECRET_HINT = /(key|token|secret|password|passwd|auth|bearer|credential|api[_-]?key|client[_-]?secret)/i;
// A long opaque string that looks like a credential rather than a flag/package.
const LOOKS_SECRET = /^(?:[A-Za-z0-9._\-]{24,}|sk-[A-Za-z0-9._\-]+|gh[pousr]_[A-Za-z0-9]+|xox[baprs]-[A-Za-z0-9-]+)$/;

// A KEY=value pair whose key names a secret (e.g. API_KEY=…, auth-token=…).
const SECRET_KV = /^[A-Za-z0-9_.-]*(?:key|token|secret|password|passwd|auth|bearer|credential)[A-Za-z0-9_.-]*=.+/i;

// A bare opaque string that looks like a credential rather than a flag/package:
// a known token shape, or 18+ mixed letters+digits in a single run (no path,
// scope, or version shape) — so we don't redact package names ("playwright"),
// semvers ("4.22.4"), or scoped packages ("@scope/pkg").
function looksLikeToken(s) {
  if (!s) return false;
  if (LOOKS_SECRET.test(s)) return true;
  return s.length >= 18 && /^[A-Za-z0-9._-]+$/.test(s) && /[A-Za-z]/.test(s) && /[0-9]/.test(s)
    && !/^v?\d+\.\d+/.test(s) && !s.includes("..");
}

// Scrub secrets embedded *inside* a single string (a combined arg, or a prose
// description): known token shapes anywhere, plus a secret-named label followed
// by an opaque value (e.g. `Authorization: Bearer sk-…`, `X-Api-Key: abc123…`).
function scrubSecrets(s) {
  if (!s) return s;
  return String(s)
    .replace(/sk-[A-Za-z0-9._-]{8,}|gh[pousr]_[A-Za-z0-9]{8,}|xox[baprs]-[A-Za-z0-9-]{6,}|AKIA[0-9A-Z]{12,}/g, "<redacted>")
    .replace(/((?:authorization|bearer|api[_-]?key|access[_-]?token|client[_-]?secret|x-[a-z-]*key|token|secret|password|passwd|credential)["':=\s]+)([A-Za-z0-9._\-+/]{12,})/gi, "$1<redacted>");
}

function redactArgs(argv) {
  if (!Array.isArray(argv)) return argv;
  const out = [];
  for (let i = 0; i < argv.length; i++) {
    const a = String(argv[i]);
    const prev = i > 0 ? String(argv[i - 1]) : "";
    // Redact the value that follows a secret-introducing token (a flag like
    // --token, or a bare label like "password"). Don't redact another flag.
    if (prev && SECRET_HINT.test(prev) && !/^-/.test(a) && !SECRET_HINT.test(a)) {
      out.push("<redacted>"); continue;
    }
    // KEY=value where the key names a secret (flag or positional form).
    if (SECRET_KV.test(a)) { out.push(a.split("=")[0] + "=<redacted>"); continue; }
    // Any URL / connection string: always sanitize it — userinfo, query string,
    // and token-looking path segments (some hosted MCP endpoints key by path).
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(a)) {
      try { new URL(a); out.push(redactUrl(a)); continue; } catch { /* not a URL */ }
    }
    // A bare opaque token passed positionally.
    if (looksLikeToken(a)) { out.push("<redacted>"); continue; }
    // A secret embedded inside one combined arg (e.g. a single `--header` value).
    const scrubbed = scrubSecrets(a);
    if (scrubbed !== a) { out.push(scrubbed); continue; }
    // Rewrite absolute home paths so usernames don't leak in args.
    out.push(a.startsWith(HOME) ? tilde(a) : a);
  }
  return out;
}

function redactUrl(u) {
  const raw = String(u);
  try {
    const url = new URL(raw);
    const auth = url.username || url.password ? "redacted@" : "";
    const segments = url.pathname.split("/").map((seg) => (looksLikeToken(seg) ? "<redacted>" : seg));
    const query = url.search ? "?<redacted>" : "";
    return `${url.protocol}//${auth}${url.host}${segments.join("/")}${query}`;
  } catch {
    return raw.replace(/([?&][^=]+=)[^&]+/g, "$1<redacted>");
  }
}

function redactRecord(obj) {
  if (!obj || typeof obj !== "object") return undefined;
  const out = {};
  for (const k of Object.keys(obj)) out[k] = "<redacted>";
  return Object.keys(out).length ? out : undefined;
}

// Turn one MCP server config into a safe, human-readable summary.
function summarizeMcp(name, cfg) {
  if (!cfg || typeof cfg !== "object") return { transport: "unknown" };
  const out = {};
  const type = cfg.type || (cfg.url ? "http" : cfg.command ? "stdio" : "unknown");
  out.transport = type;
  if (cfg.command) {
    out.command = cfg.command;
    out.args = redactArgs(cfg.args);
  }
  if (cfg.url) out.url = redactUrl(cfg.url);
  const env = redactRecord(cfg.env);
  if (env) out.env = env;
  const headers = redactRecord(cfg.headers);
  if (headers) out.headers = headers;
  return out;
}

// A short, readable label for an MCP source line.
function mcpSourceLabel(summary) {
  if (summary.url) { try { return new URL(summary.url).host; } catch { return summary.transport; } }
  if (summary.command) return [summary.command, ...(summary.args || [])].join(" ").slice(0, 60);
  return summary.transport;
}

// A one-line description for an MCP server (no secrets — summary is pre-redacted).
function mcpDescription(summary) {
  if (summary.url) { try { return `${summary.transport.toUpperCase()} MCP at ${new URL(summary.url).host}`; } catch { return `${summary.transport} MCP server`; } }
  if (summary.command) return `stdio MCP via \`${[summary.command, ...(summary.args || [])].join(" ").slice(0, 80)}\``;
  return `${summary.transport} MCP server`;
}

// ---------- usage classification ----------
const DAY = 86_400_000;

function classifyUsage(usageCount, lastUsedAt, { passive = false } = {}) {
  const now = Date.now();
  if (usageCount == null && lastUsedAt == null) return passive ? "info" : "unknown";
  const count = usageCount || 0;
  if (count > 0) return "good";
  // count == 0
  if (lastUsedAt && now - lastUsedAt < 7 * DAY) return "warn"; // recent but unused
  return "bad";
}

function usageLabel(usageCount, lastUsedAt, usageClass) {
  const now = Date.now();
  if (usageClass === "unknown") return "no usage signal";
  if (usageClass === "info") return "passive";
  if (usageCount && usageCount > 0) {
    return `✅ ${usageCount.toLocaleString()} use${usageCount === 1 ? "" : "s"}`;
  }
  if (lastUsedAt && now - lastUsedAt < 7 * DAY) return "⚠️ never (recent install)";
  return "➖ never";
}

// ---------- transcript usage scanning (PRIVACY-CRITICAL) ----------
// Streams ~/.claude/projects/*.jsonl (and one level deeper) line-by-line and
// tallies how often each MCP server / agent / skill was invoked, plus the most
// recent invocation time. The ONLY data extracted is names + counts + the
// max timestamp per key — never prompt text, message prose, command text,
// arguments, cwd, or file paths.
//
// Returns { byKey: Map<kind:name, { count, lastUsed }>, totalInvocations, transcriptsScanned }.
// `kind` is one of "mcp" | "agent" | "skill". Keys are stored normalized.

// Normalize a name for matching: lowercase, drop a leading "plugin_" / "plugin:"
// namespace, and (for "plugin:skill" / "<plugin>:<id>" shapes) take the
// meaningful trailing segment. Keeps things like "vercel:deploy" → "deploy".
function normalizeName(s) {
  if (!s) return "";
  let n = String(s).toLowerCase().trim();
  // Strip a leading plugin_ prefix (e.g. "plugin_vercel_vercel" handled by caller's
  // server logic; here we just remove a bare "plugin_" / "plugin:" lead-in).
  n = n.replace(/^plugin[_:]/, "");
  // If namespaced with a colon, take the trailing segment ("vercel:deploy" → "deploy").
  if (n.includes(":")) n = n.split(":").pop();
  return n.trim();
}

// Derive the MCP server name from a tool name like "mcp__<server>__<tool>".
// Also collapse the "plugin_<x>_<server>" convention down to "<server>" so it
// matches a configured MCP item named "<server>".
function mcpServerFromToolName(toolName) {
  const m = String(toolName).match(/^mcp__(.+?)__/);
  if (!m) return null;
  let server = m[1];
  // "plugin_vercel_vercel" → "vercel"; "plugin_claude-mem_mcp-search" → "mcp-search".
  const pm = server.match(/^plugin_[^_]+_(.+)$/);
  if (pm) server = pm[1];
  return server;
}

function transcriptKey(kind, name) {
  return `${kind}:${normalizeName(name)}`;
}

// Discover candidate .jsonl transcript files under a projects dir:
// projectsDir/*.jsonl and projectsDir/<sub>/*.jsonl (one level deeper).
function findTranscriptFiles(projectsDir) {
  const files = [];
  for (const entry of listDir(projectsDir, "dir")) {
    const sub = path.join(projectsDir, entry);
    for (const f of listDir(sub, "file")) {
      if (f.endsWith(".jsonl")) files.push(path.join(sub, f));
    }
  }
  // Also pick up any .jsonl sitting directly in projectsDir.
  for (const f of listDir(projectsDir, "file")) {
    if (f.endsWith(".jsonl")) files.push(path.join(projectsDir, f));
  }
  return files;
}

// Tally one decoded transcript line into the byKey map.
function tallyLine(obj, byKey) {
  if (!obj || typeof obj !== "object") return 0;
  const content = obj.message && obj.message.content;
  if (!Array.isArray(content)) return 0;
  const ts = obj.timestamp ? Date.parse(obj.timestamp) : NaN;
  const when = Number.isFinite(ts) ? ts : null;
  let counted = 0;
  for (const part of content) {
    if (!part || part.type !== "tool_use" || typeof part.name !== "string") continue;
    const toolName = part.name;
    let key = null;
    if (/^mcp__(.+?)__/.test(toolName)) {
      const server = mcpServerFromToolName(toolName);
      if (server) key = transcriptKey("mcp", server);
    } else if (toolName === "Agent" || toolName === "Task") {
      const sub = part.input && part.input.subagent_type;
      if (typeof sub === "string" && sub) key = transcriptKey("agent", sub);
    } else if (toolName === "Skill") {
      const sk = part.input && part.input.skill;
      if (typeof sk === "string" && sk) key = transcriptKey("skill", sk);
    }
    if (!key) continue;
    const rec = byKey.get(key) || { count: 0, lastUsed: null };
    rec.count += 1;
    if (when != null && (rec.lastUsed == null || when > rec.lastUsed)) rec.lastUsed = when;
    byKey.set(key, rec);
    counted += 1;
  }
  return counted;
}

async function scanOneTranscript(file, byKey) {
  let total = 0;
  await new Promise((resolve) => {
    let stream;
    try {
      stream = fs.createReadStream(file, { encoding: "utf8" });
    } catch { resolve(); return; }
    stream.on("error", () => resolve());
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    rl.on("line", (line) => {
      const s = line.trim();
      if (!s) return;
      let obj;
      try { obj = JSON.parse(s); } catch { return; } // skip unparseable lines
      total += tallyLine(obj, byKey);
    });
    rl.on("error", () => resolve());
    rl.on("close", () => resolve());
  });
  return total;
}

async function scanTranscripts({ transcriptsDir, quiet = false } = {}) {
  const dir = transcriptsDir || path.join(CLAUDE, "projects");
  const byKey = new Map();
  if (!exists(dir)) {
    return { byKey, totalInvocations: 0, transcriptsScanned: 0 };
  }
  const files = findTranscriptFiles(dir);
  if (!quiet) {
    process.stderr.write(`  scanning ${files.length} transcript file${files.length === 1 ? "" : "s"}…\n`);
  }
  let totalInvocations = 0;
  let transcriptsScanned = 0;
  for (const file of files) {
    totalInvocations += await scanOneTranscript(file, byKey);
    transcriptsScanned += 1;
  }
  return { byKey, totalInvocations, transcriptsScanned };
}

// ---------- inventory build ----------
// Collects every skill / agent / plugin / MCP item from the local install,
// optionally overlays transcript usage, and returns the inventory OBJECT.
// Does NOT write or print anything.
export async function buildInventory(opts = {}) {
  const { transcripts = true, transcriptsDir, quiet = false } = opts;

  const root = readJSON(path.join(HOME, ".claude.json")) || {};
  const skillUsage = root.skillUsage || {};
  const pluginUsage = root.pluginUsage || {};

  const items = [];
  const projectNames = new Set();
  // basename -> tilde'd `.claude` dir for each project that has any items. Emitted
  // so the web app can show a project's on-disk location even when it has only MCP
  // servers (which carry no per-item path for the UI to derive a location from).
  const projectLocations = {};

  function addSkill(scope, project, dirName, skillDir) {
    const fm = parseFrontmatter(readText(path.join(skillDir, "SKILL.md")));
    const name = fm.name || dirName;
    // usage tables key skills by their invocation name (bare or plugin:skill).
    const u = skillUsage[name] || skillUsage[dirName] || null;
    const usageCount = u ? (u.usageCount ?? null) : null;
    const lastUsedAt = u ? (u.lastUsedAt ?? null) : null;
    const usageClass = classifyUsage(usageCount, lastUsedAt);
    items.push({
      id: `skill:${scope === "global" ? "global" : "project:" + project}:${dirName}`,
      type: "skill", scope, project: scope === "global" ? null : project,
      name, description: scrubSecrets(fm.description || ""),
      path: tilde(skillDir),
      usageCount, lastUsedAt, usageClass,
      usageLabel: usageLabel(usageCount, lastUsedAt, usageClass),
      // dir name is used to match transcript Skill invocations (input.skill).
      _matchKind: "skill", _matchName: dirName,
      removeCmd: scope === "global"
        ? `rm -rf ${tilde(skillDir)}`
        : `git rm -r .claude/skills/${dirName}`,
    });
  }

  function addAgent(scope, project, fileName, agentFile) {
    const base = fileName.replace(/\.md$/, "");
    const fm = parseFrontmatter(readText(agentFile));
    const name = fm.name || base;
    const u = skillUsage[name] || skillUsage[base] || null; // agents sometimes appear here too
    const usageCount = u ? (u.usageCount ?? null) : null;
    const lastUsedAt = u ? (u.lastUsedAt ?? null) : null;
    const usageClass = classifyUsage(usageCount, lastUsedAt, { passive: true });
    items.push({
      id: `agent:${scope === "global" ? "global" : "project:" + project}:${base}`,
      type: "agent", scope, project: scope === "global" ? null : project,
      name, description: scrubSecrets(fm.description || ""),
      path: tilde(agentFile),
      usageCount, lastUsedAt, usageClass,
      usageLabel: usageLabel(usageCount, lastUsedAt, usageClass),
      // filename stem is used to match transcript Agent invocations (subagent_type).
      _matchKind: "agent", _matchName: base,
      removeCmd: scope === "global"
        ? `rm ${tilde(agentFile)}`
        : `git rm .claude/agents/${fileName}`,
    });
  }

  function addMcp(scope, project, name, cfg) {
    const summary = summarizeMcp(name, cfg);
    items.push({
      id: `mcp:${scope === "global" ? "global" : "project:" + project}:${name}`,
      type: "mcp", scope, project: scope === "global" ? null : project,
      name, description: mcpDescription(summary),
      source: mcpSourceLabel(summary),
      usageCount: null, lastUsedAt: null, usageClass: "info",
      usageLabel: "passive (surfaced on demand)",
      // server name is used to match transcript mcp__<server>__ invocations.
      _matchKind: "mcp", _matchName: name,
      removeCmd: scope === "global"
        ? `claude mcp remove ${name} -s user`
        : `claude mcp remove ${name}`,
    });
  }

  // ---- global skills ----
  const globalSkillsDir = path.join(CLAUDE, "skills");
  for (const d of listDir(globalSkillsDir, "dir")) {
    const dir = path.join(globalSkillsDir, d);
    if (exists(path.join(dir, "SKILL.md"))) addSkill("global", null, d, dir);
  }

  // ---- global agents ----
  const globalAgentsDir = path.join(CLAUDE, "agents");
  for (const f of listDir(globalAgentsDir, "file")) {
    if (f.endsWith(".md")) addAgent("global", null, f, path.join(globalAgentsDir, f));
  }

  // ---- plugins (global; installed_plugins.json) ----
  const installed = readJSON(path.join(CLAUDE, "plugins", "installed_plugins.json"));
  if (installed && installed.plugins) {
    for (const [key, entries] of Object.entries(installed.plugins)) {
      const entry = Array.isArray(entries) ? entries[0] : entries;
      const [pluginName, marketplace] = key.split("@");
      const u = pluginUsage[key] || null;
      const usageCount = u ? (u.usageCount ?? null) : null;
      const lastUsedAt = u ? (u.lastUsedAt ?? null) : null;
      const usageClass = classifyUsage(usageCount, lastUsedAt);
      const installPath = entry && entry.installPath
        ? (entry.installPath.startsWith(HOME) ? tilde(entry.installPath) : "<external>")
        : undefined;
      items.push({
        // Bare name; the marketplace lives in `source` (matches the demo shape).
        id: `plugin:global:${pluginName}`,
        type: "plugin", scope: "global", project: null,
        name: pluginName,
        description: "", // not stored locally; the demo/curation can add it
        source: marketplace || "",
        version: entry ? entry.version : undefined,
        path: installPath,
        usageCount, lastUsedAt, usageClass,
        usageLabel: usageLabel(usageCount, lastUsedAt, usageClass),
        // The CLI wants the full name@marketplace form to uninstall.
        removeCmd: `claude plugins uninstall ${key} -y`,
      });
    }
  }

  // ---- global MCP servers ----
  for (const [name, cfg] of Object.entries(root.mcpServers || {})) {
    addMcp("global", null, name, cfg);
  }

  // ---- per-project (from every known project path in ~/.claude.json) ----
  const projectPaths = new Set();
  if (exists(path.join(process.cwd(), ".claude")) || exists(path.join(process.cwd(), ".mcp.json"))) {
    projectPaths.add(process.cwd());
  }
  for (const p of Object.keys(root.projects || {})) projectPaths.add(p);

  for (const projPath of projectPaths) {
    if (!exists(projPath)) continue; // path may be stale
    // The home directory's .claude IS the global scope. If a project path points
    // at $HOME (the scan was run from there, or $HOME is registered in
    // ~/.claude.json's projects), its .claude/skills are the SAME files already
    // counted as global — scanning it as a "project" would duplicate every global
    // skill, agent, and MCP server (showing up as a phantom project named after
    // your username). Skip it.
    if (path.resolve(path.join(projPath, ".claude")) === path.resolve(CLAUDE)) continue;
    const project = path.basename(projPath);
    const projConf = (root.projects && root.projects[projPath]) || {};

    let touched = false;

    // project skills
    const pSkills = path.join(projPath, ".claude", "skills");
    for (const d of listDir(pSkills, "dir")) {
      const dir = path.join(pSkills, d);
      if (exists(path.join(dir, "SKILL.md"))) { addSkill("project", project, d, dir); touched = true; }
    }
    // project agents
    const pAgents = path.join(projPath, ".claude", "agents");
    for (const f of listDir(pAgents, "file")) {
      if (f.endsWith(".md")) { addAgent("project", project, f, path.join(pAgents, f)); touched = true; }
    }
    // project MCP servers — from ~/.claude.json projects[path].mcpServers and/or .mcp.json
    const fromConf = projConf.mcpServers || {};
    const fromFile = (readJSON(path.join(projPath, ".mcp.json")) || {}).mcpServers || {};
    for (const [name, cfg] of Object.entries({ ...fromFile, ...fromConf })) {
      addMcp("project", project, name, cfg); touched = true;
    }

    if (touched) {
      projectNames.add(project);
      projectLocations[project] = tilde(path.join(projPath, ".claude"));
    }
  }

  // ---- transcript usage overlay ----
  let usageSummary;
  if (transcripts) {
    const { byKey, totalInvocations, transcriptsScanned } = await scanTranscripts({ transcriptsDir, quiet });

    // Match each tracked item (skill / agent / mcp) to its transcript tally.
    let itemsWithUsage = 0;
    let itemsUnused = 0;
    for (const item of items) {
      if (!item._matchKind) continue; // plugins are not transcript-tracked
      const key = transcriptKey(item._matchKind, item._matchName);
      const rec = byKey.get(key);
      const count = rec ? rec.count : 0;
      const last = rec ? rec.lastUsed : null;
      item.invocationCount = count;
      item.lastUsed = last;
      item.usageSource = "transcripts";
      if (count > 0) {
        itemsWithUsage += 1;
        // Light up the existing UI fields from the transcript signal.
        item.usageCount = count;
        item.lastUsedAt = last;
        item.usageClass = classifyUsage(count, last);
        item.usageLabel = usageLabel(count, last, item.usageClass);
      } else {
        // No transcript invocations → genuinely never used. Reflect that in the
        // existing UI fields so the per-item badge, the "unused" filter, the
        // stat cell, and usageSummary.itemsUnused all describe the same set.
        // (The transcript corpus is the authoritative usage record; a tracked
        // item absent from it has not been used.)
        item.usageCount = 0;
        item.lastUsedAt = last;
        item.usageClass = classifyUsage(0, last);
        item.usageLabel = usageLabel(0, last, item.usageClass);
        itemsUnused += 1;
      }
    }

    usageSummary = {
      totalInvocations,
      itemsWithUsage,
      itemsUnused,
      transcriptsScanned,
      generatedFrom: "transcripts",
    };
  } else {
    // Transcripts disabled — preserve today's ~/.claude.json behavior and just
    // annotate the usageSource per item so consumers know where the signal came from.
    for (const item of items) {
      if (item.type === "skill") {
        item.usageSource = (item.usageCount != null || item.lastUsedAt != null) ? "claude-json" : "none";
      } else if (item.type === "agent" || item.type === "mcp") {
        item.usageSource = "none";
      }
    }
  }

  // Drop internal matching helpers before emitting.
  for (const item of items) { delete item._matchKind; delete item._matchName; }

  const inventory = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    generator: GENERATOR,
    machine: { platform: process.platform, node: process.version },
    projects: [...projectNames].sort((a, b) => a.localeCompare(b)),
    projectLocations,
    items,
  };
  if (usageSummary) inventory.usageSummary = usageSummary;
  return inventory;
}

// ---------- scan: build + write/print + log summary ----------
export async function runScan(opts = {}) {
  const {
    stdout = false,
    outFile = "claude-inventory.json",
    transcripts = true,
    transcriptsDir,
    quiet = false,
  } = opts;

  const inventory = await buildInventory({ transcripts, transcriptsDir, quiet });
  const json = JSON.stringify(inventory, null, 2);

  const outPath = path.resolve(process.cwd(), outFile);
  if (stdout) {
    process.stdout.write(json + "\n");
  } else {
    fs.writeFileSync(outPath, json);
  }

  // summary counts for the console
  const items = inventory.items;
  const by = (t) => items.filter((i) => i.type === t).length;
  const g = items.filter((i) => i.scope === "global").length;
  const p = items.length - g;

  const log = (s) => process.stderr.write(s + "\n");
  log("");
  log("  Claude Inventory Tool — scan complete");
  log("  ─────────────────────────────────────");
  log(`  skills ${by("skill")}   plugins ${by("plugin")}   mcp ${by("mcp")}   agents ${by("agent")}`);
  log(`  ${g} global · ${p} project   across ${inventory.projects.length} project${inventory.projects.length === 1 ? "" : "s"}`);
  if (inventory.usageSummary) {
    const us = inventory.usageSummary;
    log(`  usage: ${us.totalInvocations.toLocaleString()} invocations · ${us.itemsWithUsage} used · ${us.itemsUnused} unused   (${us.transcriptsScanned} transcript${us.transcriptsScanned === 1 ? "" : "s"})`);
  }
  log("");
  if (!stdout) {
    log(`  ✓ wrote ${outPath}`);
    log("  → open the web app and drop this file in.");
    log("");
  }
  return inventory;
}

export { scrubSecrets, redactArgs, redactUrl, looksLikeToken };

// ---------- CLI arg parsing + auto-run guard ----------
function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--stdout" || a === "--print") opts.stdout = true;
    else if (a === "--no-transcripts") opts.transcripts = false;
    else if (a === "--transcripts-dir") opts.transcriptsDir = argv[++i];
    else if (a.startsWith("--transcripts-dir=")) opts.transcriptsDir = a.slice("--transcripts-dir=".length);
    else if (a === "--out") opts.outFile = argv[++i];
    else if (a.startsWith("--out=")) opts.outFile = a.slice("--out=".length);
  }
  return opts;
}

// Run when invoked directly (`node scan.mjs`) or piped (`curl … | node`),
// but NOT when imported (e.g. by bin/cli.mjs).
const invokedDirectly = !process.argv[1] || import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  runScan(parseArgs(process.argv.slice(2))).catch((err) => {
    process.stderr.write(`\n  ✗ scan failed: ${err && err.message ? err.message : err}\n`);
    process.exit(1);
  });
}
