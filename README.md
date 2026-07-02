# AI Coder Prompts

A plugin collection that implements a **spec-driven development workflow** — turning a
feature description into working, reviewed, and archived code through an orchestrated
flow.

## spec-flow

The `spec-flow/` directory contains:

- a Claude Code plugin, including bundled Claude subagents
- a Codex installer plugin, which installs Codex skills and translates the bundled
  Claude subagents into Codex custom-agent TOML

Install it once and the assistant can run the full pipeline for you:

```
spec  →  design  →  implement ⇄ review  →  archive
```

Each phase is handled by a dedicated subagent/custom agent. The orchestrator pauses at
each gate for your approval before proceeding. See [`spec-flow/README.md`](spec-flow/README.md)
for how it works.

## Installation

### Claude Code

Copy the plugin into your Claude Code user plugins directory:

```bash
cp -r spec-flow ~/.claude/plugins/spec-flow
```

Or, to make it available project-locally only:

```bash
cp -r spec-flow .claude/plugins/spec-flow
```

### Codex

Codex plugins do not currently bundle custom subagents as directly loadable runtime
agents, so `spec-flow` uses an installer. The installer copies the workflow skills and
converts `spec-flow/agents/*.md` into Codex custom-agent TOML files.

Run the installer directly:

```bash
node spec-flow/scripts/install.mjs --scope project
```

or install it for your user:

```bash
node spec-flow/scripts/install.mjs --scope user
```

Project scope writes to `.agents/skills/` and `.codex/agents/` under the current
project. User scope writes to `~/.agents/skills/` and `~/.codex/agents/`.

The same installer is also exposed through the Codex plugin manifest at
`spec-flow/.codex-plugin/plugin.json` as the `$spec-flow-installer` skill.

## Usage

1. **One-time setup** — run `/update-project` in Claude Code or invoke the
   `$spec-flow-update-project` skill in Codex to generate `project.md`. This gives the
   spec and design phases richer context (optional but recommended).

2. **Describe a feature** — just tell the assistant what you want to build. The
   orchestrator triggers automatically and drives the full flow, pausing for your
   sign-off after each phase.

   > *"spec out and add JWT auth with refresh tokens"*

That's it. The orchestrator delegates to subagents, hands off through
`spec-history/active/` file artifacts, and surfaces each phase's output for your review
before continuing.

## What gets produced

| Phase | Artifact |
|---|---|
| spec | `spec-history/active/spec.md` |
| design | `spec-history/active/design.md` |
| implement | code changes in your repo |
| review | inline reviewer findings returned to the orchestrator; loops until passing |
| archive | `spec-history/{date}-{seq}-{title}/` + updated `spec-history/up-to-date/` |

## License

MIT — see [LICENSE](LICENSE).
