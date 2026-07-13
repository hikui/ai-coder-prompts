# spec-flow

A Claude Code plugin and Codex installer plugin that runs the spec-driven development
workflow as a single **automatic, orchestrated flow** instead of four separate
commands.

You describe a feature once. An orchestrator drives it through four phases, delegating
each phase to a dedicated subagent that hands off through file artifacts, and pausing
for your approval between phases:

```
spec  →  design  →  implement ⇄ review  →  archive
```

The implement phase is itself a loop: the implementer writes code, a code reviewer
checks it against the spec, the design, and a quality bar, and the implementer fixes
what's flagged — repeating until the review passes before it reaches your gate.

The design carries a **task breakdown** — the work split into tasks with a dependency
graph and disjoint file ownership. The orchestrator runs independent tasks **in
parallel**, each on its own git worktree with its own implement ⇄ review loop, merges
each as it passes, then runs one **integration review** over the combined result before
your gate. Sequential features just run as a single task — no forced splitting.

## How it works

```
You describe a feature
        │
        ▼
┌──────────────────────────────────────────────┐
│  spec-flow orchestrator  (skill, main session)│
│  drives phases, owns the approval gates        │
└──────────────────────────────────────────────┘
   │ dispatch      │ dispatch     │ dispatch  ⇄ dispatch    │ dispatch
   ▼               ▼              ▼            ▼             ▼
spec-writer  →  designer  →  implementer ⇄ code-reviewer  →  archivist
   │               │              │            │             │
   ▼               ▼              ▼            ▼             ▼
spec.md    ──►  design.md  ──►   code   ◄── review findings ─►  archive + up-to-date specs
        (spec.md/design.md are the persisted protocol; review findings flow through the orchestrator)
```

- **Orchestrator** — a skill that runs in the main session (the only place that can
  spawn subagents). It coordinates the phases and stops at each gate for your sign-off.
- **Subagents / custom agents** — one per phase, each a fresh context focused on a
  single job. They never hand work back through the conversation; they **write files**
  and return a short handoff report.
- **Files as the protocol** — the persisted artifacts in `spec-history/active/`
  (`spec.md`, `design.md`) are the shared state. spec-writer writes `spec.md`; designer
  reads it and writes `design.md`; implementer reads both and writes code; code-reviewer
  reads everything and reports its findings to the orchestrator, which relays the
  blocking/major items to the implementer to fix; archivist reads it all plus the code,
  then files it away and refreshes `spec-history/up-to-date/` from the real
  implementation.
- **Model tiers** — design and review run on a higher-capability model (they set the
  bar and catch mistakes); implementation runs on a standard model (it follows an
  already-vetted design). Configured per subagent via tier aliases, so no specific
  model version is pinned.

Keeping the detail in files (not in the orchestrator's context) is what lets a long,
multi-phase build run without the controller's context ballooning.

## Approval gates

The flow pauses after **spec**, after **design**, **before implementation begins**, and
after **implement**. At each gate the orchestrator shows you the artifact, then stops
and explicitly waits for your go-ahead before dispatching the next subagent — it won't
chain phases in a single turn. Notably, an approved design does not auto-start coding:
the orchestrator asks you to acknowledge before it dispatches the implementer. A
subagent that hits a hard blocker surfaces it immediately rather than waiting for the
gate.

### Auto mode

Say *"auto mode"*, *"run it end to end"*, or *"no gates"* and the orchestrator runs all
four phases without pausing for your approval. The human gates are dropped outright —
spec and design verification are skipped, there's no automated verifier standing in for
you. If the spec-writer or designer comes back with `DECISIONS NEEDED` (an assumption
it made, a question it couldn't resolve alone), the orchestrator answers it directly and
keeps moving instead of stopping. The implement ⇄ review loop and archive run
automatically on top. Auto mode still stops for a hard blocker it genuinely can't work
around. You trade the approval gates (and the verification step) for speed plus the same
file-based audit trail.

## Installation

### Claude Code

Copy this directory into a Claude Code plugin location:

```bash
cp -r spec-flow ~/.claude/plugins/spec-flow
```

or project-locally:

```bash
cp -r spec-flow .claude/plugins/spec-flow
```

### Codex

Codex can load plugin-bundled skills, but custom agents are standalone TOML files under
`~/.codex/agents/` or `.codex/agents/`. The bundled Node installer handles that gap:
it installs the workflow skills and translates `agents/*.md` into Codex custom-agent
TOML on the fly.

Install for the current project:

```bash
node spec-flow/scripts/install.mjs --scope project
```

Install for your user:

```bash
node spec-flow/scripts/install.mjs --scope user
```

Project scope writes:

- `.agents/skills/spec-flow/`
- `.agents/skills/update-project/`
- `.codex/agents/spec-flow-*.toml`

User scope writes:

- `~/.agents/skills/spec-flow/`
- `~/.agents/skills/update-project/`
- `~/.codex/agents/spec-flow-*.toml`

Use `--dry-run` to preview the install and `--force` to overwrite an older generated
install.

The Codex plugin manifest at `.codex-plugin/plugin.json` exposes an installer skill,
`$spec-flow-installer`, for users who install this as a Codex plugin first.

## Usage

Just describe what you want to build — e.g. *"spec out and add JWT auth with refresh
tokens"* — and the orchestrator triggers automatically.

Run `/update-project` in Claude Code, or `$spec-flow-update-project` in Codex, once per
repo first to generate `project.md`, which gives the spec and design phases richer
context (optional but recommended).

## Layout

```
spec-flow/
├── .claude-plugin/plugin.json
├── .codex-plugin/plugin.json       # Codex installer plugin manifest
├── scripts/install.mjs             # installs skills + translates agents to TOML
├── skills/spec-flow/SKILL.md      # orchestrator (controller)
├── skills/spec-flow-installer/SKILL.md
├── skills/update-project/SKILL.md  # Codex project.md setup skill
├── agents/
│   ├── spec-writer.md             # ← make-spec
│   ├── designer.md                # ← make-design  (high-end tier; outlines SOLID structure)
│   ├── implementer.md             # ← implement    (standard tier)
│   ├── code-reviewer.md           # reviews code vs spec/design + quality (high-end tier)
│   └── archivist.md               # ← make-archive
└── commands/update-project.md     # one-time project.md setup
```
