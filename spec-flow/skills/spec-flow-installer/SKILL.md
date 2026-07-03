---
name: spec-flow-installer
description: Install the spec-flow Codex workflow. Use when the user wants to set up, reinstall, or update spec-flow for Codex, choosing user-level or project-level installation. Runs the bundled Node installer, which installs skills and translates the bundled Claude-style subagents into Codex custom-agent TOML.
---

# Spec-Flow Installer

Install or update the spec-flow workflow for Codex.

## What this installs

- Skills:
  - `spec-flow`
  - `spec-flow-update-project`
- Custom agents translated from `spec-flow/agents/*.md` into Codex TOML:
  - `spec-flow-spec-writer`
  - `spec-flow-designer`
  - `spec-flow-implementer`
  - `spec-flow-code-reviewer`
  - `spec-flow-archivist`

## Scope choice

Ask the user whether they want a `project` or `user` install unless they already said so.

- `project`: install skills into `$PROJECT_ROOT/.agents/skills` and agents into
  `$PROJECT_ROOT/.codex/agents`.
- `user`: install skills into `$HOME/.agents/skills` and agents into
  `$HOME/.codex/agents`.

Prefer `project` when the workflow should be checked in or shared with teammates.
Prefer `user` when the workflow is a personal default across repositories.

## Run the installer

Resolve the plugin root from this skill file. If this skill file is at:

```text
<plugin-root>/skills/spec-flow-installer/SKILL.md
```

then the installer is at:

```text
<plugin-root>/scripts/install.mjs
```

Do not assume the current working directory is the skill directory. Run the installer
with the resolved absolute path:

```bash
node <plugin-root>/scripts/install.mjs --scope project
```

or:

```bash
node <plugin-root>/scripts/install.mjs --scope user
```

Use `--force` when the user explicitly wants to overwrite an existing spec-flow install.
Use `--dry-run` to preview paths and generated files without writing.

After installation, tell the user to start a new Codex session or restart Codex if the
new skills or agents do not appear immediately.
