# spec-flow

A Claude Code plugin that runs the spec-driven development workflow as a single
**automatic, orchestrated flow** instead of four separate commands.

You describe a feature once. An orchestrator drives it through four phases, delegating
each phase to a dedicated subagent that hands off through file artifacts, and pausing
for your approval between phases:

```
spec  →  design  →  implement ⇄ review  →  archive
```

The implement phase is itself a loop: the implementer writes code, a code reviewer
checks it against the spec, the design, and a quality bar, and the implementer fixes
what's flagged — repeating until the review passes before it reaches your gate.

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
spec.md    ──►  design.md  ──►   code   ◄──  review.md  ──►  archive + up-to-date specs
        (the file artifacts are the communication protocol)
```

- **Orchestrator** — a skill that runs in the main session (the only place that can
  spawn subagents). It coordinates the phases and stops at each gate for your sign-off.
- **Subagents** — one per phase, each a fresh context focused on a single job. They
  never hand work back through the conversation; they **write files** and return a
  short handoff report.
- **Files as the protocol** — the artifacts in `spec-history/active/` are the shared
  state. spec-writer writes `spec.md`; designer reads it and writes `design.md`;
  implementer reads both and writes code; code-reviewer reads everything and writes
  `review.md`; implementer reads `review.md` to fix what's flagged; archivist reads it
  all plus the code, then files it away and refreshes `spec-history/up-to-date/` from
  the real implementation.
- **Model tiers** — design and review run on a higher-capability model (they set the
  bar and catch mistakes); implementation runs on a standard model (it follows an
  already-vetted design). Configured per subagent via tier aliases, so no specific
  model version is pinned.

Keeping the detail in files (not in the orchestrator's context) is what lets a long,
multi-phase build run without the controller's context ballooning.

## Approval gates

The flow pauses after **spec**, after **design**, and after **implement**. At each gate
the orchestrator shows you the artifact and waits for your go-ahead. A subagent that
hits a hard blocker surfaces it immediately rather than waiting for the gate.

## Usage

Just describe what you want to build — e.g. *"spec out and add JWT auth with refresh
tokens"* — and the orchestrator triggers automatically.

Run `/update-project` once per repo first to generate `project.md`, which gives the
spec and design phases richer context (optional but recommended).

## Layout

```
spec-flow/
├── .claude-plugin/plugin.json
├── skills/spec-flow/SKILL.md      # orchestrator (controller)
├── agents/
│   ├── spec-writer.md             # ← make-spec
│   ├── designer.md                # ← make-design  (high-end tier; outlines SOLID structure)
│   ├── implementer.md             # ← implement    (standard tier)
│   ├── code-reviewer.md           # reviews code vs spec/design + quality (high-end tier)
│   └── archivist.md               # ← make-archive
└── commands/update-project.md     # one-time project.md setup
```
