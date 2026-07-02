#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import process from "node:process";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

const SOURCE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AGENTS_SOURCE_DIR = path.join(SOURCE_ROOT, "agents");
const SKILLS_SOURCE_DIR = path.join(SOURCE_ROOT, "skills");

const AGENT_NAME_PREFIX = "spec-flow-";
const MODEL_MAP = {
  opus: { model: "gpt-5.5", effort: "high" },
  sonnet: { model: "gpt-5.4", effort: "medium" },
  haiku: { model: "gpt-5.4-mini", effort: "low" }
};

main().catch((error) => {
  console.error(`spec-flow install failed: ${error.message}`);
  process.exitCode = 1;
});

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const scope = options.scope ?? await promptForScope();
  if (!["user", "project"].includes(scope)) {
    throw new Error(`--scope must be "user" or "project"; got ${scope}`);
  }

  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  const agentPrefix = options.noAgentPrefix ? "" : options.agentPrefix ?? AGENT_NAME_PREFIX;
  const targets = getTargets(scope, projectRoot);
  const agentFiles = await listMarkdownFiles(AGENTS_SOURCE_DIR);
  const skillDirs = await listSkillDirs(SKILLS_SOURCE_DIR);
  const agentNameMap = new Map();

  for (const file of agentFiles) {
    const source = await readAgentMarkdown(file);
    agentNameMap.set(source.meta.name, `${agentPrefix}${source.meta.name}`);
  }

  const planned = [];
  for (const skillDir of skillDirs) {
    planned.push(...await planSkillInstall(skillDir, targets.skillsDir, agentNameMap));
  }
  for (const file of agentFiles) {
    planned.push(await planAgentInstall(file, targets.agentsDir, agentNameMap));
  }

  printPlan({ scope, projectRoot, targets, planned, dryRun: options.dryRun });
  if (options.dryRun) return;

  for (const item of planned) {
    await writePlannedFile(item, { force: options.force });
  }

  console.log("");
  console.log("Installed spec-flow for Codex.");
  console.log(`Skills: ${targets.skillsDir}`);
  console.log(`Agents: ${targets.agentsDir}`);
  console.log("Start a new Codex session or restart Codex if the new skills/agents are not visible yet.");
}

function parseArgs(args) {
  const options = {
    force: false,
    dryRun: false,
    noAgentPrefix: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    switch (arg) {
      case "--scope":
        options.scope = requireValue(args, ++index, arg);
        break;
      case "--project-root":
        options.projectRoot = requireValue(args, ++index, arg);
        break;
      case "--agent-prefix":
        options.agentPrefix = requireValue(args, ++index, arg);
        break;
      case "--no-agent-prefix":
        options.noAgentPrefix = true;
        break;
      case "--force":
        options.force = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "-h":
      case "--help":
        printHelp();
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (options.noAgentPrefix && options.agentPrefix) {
    throw new Error("Use either --agent-prefix or --no-agent-prefix, not both");
  }

  return options;
}

function requireValue(args, index, option) {
  const value = args[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`${option} requires a value`);
  }
  return value;
}

async function promptForScope() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Missing --scope user|project in non-interactive mode");
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question("Install spec-flow for Codex at project or user scope? [project] ");
    const normalized = answer.trim().toLowerCase();
    return normalized || "project";
  } finally {
    rl.close();
  }
}

function getTargets(scope, projectRoot) {
  if (scope === "user") {
    return {
      skillsDir: path.join(os.homedir(), ".agents", "skills"),
      agentsDir: path.join(os.homedir(), ".codex", "agents")
    };
  }

  return {
    skillsDir: path.join(projectRoot, ".agents", "skills"),
    agentsDir: path.join(projectRoot, ".codex", "agents")
  };
}

async function listMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(dir, entry.name))
    .sort();
}

async function listSkillDirs(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .filter((entry) => entry.name !== "spec-flow-installer")
    .map((entry) => path.join(dir, entry.name))
    .sort();
}

async function planSkillInstall(sourceDir, targetSkillsDir, agentNameMap) {
  const skillName = path.basename(sourceDir);
  const targetDir = path.join(targetSkillsDir, skillName);
  const files = await listFilesRecursive(sourceDir);
  const planned = [];

  for (const sourcePath of files) {
    const relative = path.relative(sourceDir, sourcePath);
    const targetPath = path.join(targetDir, relative);
    const raw = await fs.readFile(sourcePath, "utf8");
    const contents = relative === "SKILL.md"
      ? adaptSkillForCodex(raw, agentNameMap)
      : raw;
    planned.push({ kind: "skill", sourcePath, targetPath, contents });
  }

  return planned;
}

async function listFilesRecursive(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFilesRecursive(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }
  return files.sort();
}

function adaptSkillForCodex(contents, agentNameMap) {
  let adapted = contents;
  for (const [sourceName, codexName] of agentNameMap) {
    adapted = adapted.replaceAll(`\`${sourceName}\``, `\`${codexName}\``);
  }

  if (!adapted.includes("## Codex custom agents")) {
    adapted = adapted.replace(
      "# Spec-Flow Orchestrator\n",
      `# Spec-Flow Orchestrator

## Codex custom agents

This installed Codex skill delegates to project or user custom agents installed by
\`spec-flow-installer\`. When these instructions say to dispatch a subagent, spawn the
matching Codex custom agent by name:

${[...agentNameMap.entries()].map(([sourceName, codexName]) => `- \`${sourceName}\` -> \`${codexName}\``).join("\n")}

`
    );
  }

  return adapted;
}

async function planAgentInstall(sourcePath, targetAgentsDir, agentNameMap) {
  const source = await readAgentMarkdown(sourcePath);
  const sourceName = source.meta.name;
  const codexName = agentNameMap.get(sourceName);
  const targetPath = path.join(targetAgentsDir, `${codexName}.toml`);
  const contents = renderAgentToml(source, codexName);
  return { kind: "agent", sourcePath, targetPath, contents };
}

async function readAgentMarkdown(sourcePath) {
  const contents = await fs.readFile(sourcePath, "utf8");
  const parsed = parseFrontmatter(contents);
  for (const key of ["name", "description"]) {
    if (!parsed.meta[key]) {
      throw new Error(`${path.relative(SOURCE_ROOT, sourcePath)} is missing frontmatter field: ${key}`);
    }
  }
  return parsed;
}

function parseFrontmatter(contents) {
  if (!contents.startsWith("---\n")) {
    throw new Error("Expected YAML frontmatter");
  }

  const end = contents.indexOf("\n---", 4);
  if (end === -1) {
    throw new Error("Unterminated YAML frontmatter");
  }

  const frontmatter = contents.slice(4, end).trim();
  const body = contents.slice(end + "\n---".length).replace(/^\s*\n/, "");
  const meta = {};

  for (const line of frontmatter.split("\n")) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    meta[key] = rawValue.trim().replace(/^["']|["']$/g, "");
  }

  return { meta, body };
}

function renderAgentToml(source, codexName) {
  const modelConfig = MODEL_MAP[source.meta.model] ?? {};
  const body = [
    "You are a Codex custom agent translated from a Claude Code subagent definition.",
    "Follow the behavior below, but use Codex tools and approvals available in the current session.",
    "Do not assume Claude-only tool names are available; map the requested file, shell, search, and web capabilities to the Codex environment.",
    "",
    source.body.trimEnd()
  ].join("\n");

  const lines = [
    `name = ${tomlString(codexName)}`,
    `description = ${tomlString(source.meta.description)}`
  ];

  if (modelConfig.model) {
    lines.push(`model = ${tomlString(modelConfig.model)}`);
  }
  if (modelConfig.effort) {
    lines.push(`model_reasoning_effort = ${tomlString(modelConfig.effort)}`);
  }

  lines.push(`developer_instructions = ${tomlString(body)}`);
  lines.push("");
  return lines.join("\n");
}

function tomlString(value) {
  const normalized = String(value).replace(/\r\n/g, "\n");
  if (normalized.includes("\n") && !normalized.includes("'''")) {
    return `'''\n${normalized}\n'''`;
  }
  return JSON.stringify(normalized);
}

function printPlan({ scope, projectRoot, targets, planned, dryRun }) {
  console.log(`spec-flow Codex install (${dryRun ? "dry run" : "write"})`);
  console.log(`Scope: ${scope}`);
  if (scope === "project") {
    console.log(`Project root: ${projectRoot}`);
  }
  console.log(`Skills target: ${targets.skillsDir}`);
  console.log(`Agents target: ${targets.agentsDir}`);
  console.log("");
  for (const item of planned) {
    console.log(`${item.kind}: ${path.relative(SOURCE_ROOT, item.sourcePath)} -> ${item.targetPath}`);
  }
}

async function writePlannedFile(item, { force }) {
  await fs.mkdir(path.dirname(item.targetPath), { recursive: true });

  let existing = null;
  try {
    existing = await fs.readFile(item.targetPath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  if (existing !== null && existing !== item.contents && !force) {
    throw new Error(`${item.targetPath} already exists with different content; rerun with --force to overwrite`);
  }

  await fs.writeFile(item.targetPath, item.contents, "utf8");
}

function printHelp() {
  console.log(`Install spec-flow skills and Codex custom agents.

Usage:
  node scripts/install.mjs --scope project [--project-root PATH] [--force] [--dry-run]
  node scripts/install.mjs --scope user [--force] [--dry-run]

Options:
  --scope user|project     Install to user-level or project-level Codex paths.
  --project-root PATH      Project root for project scope. Defaults to cwd.
  --agent-prefix PREFIX    Prefix generated custom agent names. Defaults to spec-flow-.
  --no-agent-prefix        Preserve source agent names exactly.
  --force                  Overwrite existing files with different content.
  --dry-run                Print planned writes without changing files.
`);
}
