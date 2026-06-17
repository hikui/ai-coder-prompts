# AI Coder Prompts

A Claude Code plugin that implements a **spec-driven development workflow** — turning a
feature description into working, reviewed, and archived code through an automatic
orchestrated flow.

## spec-flow

The `spec-flow/` directory is a Claude Code plugin. Install it once and Claude Code runs
the full pipeline for you:

```
spec  →  design  →  implement ⇄ review  →  archive
```

Each phase is handled by a dedicated subagent. The orchestrator pauses at each gate for
your approval before proceeding. See [`spec-flow/README.md`](spec-flow/README.md) for
how it works.

## Installation

Copy the plugin into your Claude Code user plugins directory:

```bash
cp -r spec-flow ~/.claude/plugins/spec-flow
```

Or, to make it available project-locally only:

```bash
cp -r spec-flow .claude/plugins/spec-flow
```

## Usage

1. **One-time setup** — run `/update-project` in your repo to generate `project.md`.
   This gives the spec and design phases richer context (optional but recommended).

2. **Describe a feature** — just tell Claude what you want to build. The orchestrator
   triggers automatically and drives the full flow, pausing for your sign-off after each
   phase.

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
| review | `spec-history/active/review.md` (internal; loops until passing) |
| archive | `spec-history/{date}-{seq}-{title}/` + updated `spec-history/up-to-date/` |

## License

MIT — see [LICENSE](LICENSE).
