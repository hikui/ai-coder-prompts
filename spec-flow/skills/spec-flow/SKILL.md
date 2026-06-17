---
name: spec-flow
description: Spec-driven workflow orchestrator. Use this whenever the user wants to build a non-trivial feature, change, or capability in a codebase that follows the spec → design → implement → archive process (look for a spec-history/ folder). Trigger it when the user says things like "spec out and build X", "let's add feature Y", "I want to implement Z properly", "run the spec flow for…", or describes a substantial requirement they want turned into code with a paper trail — even if they don't name the workflow. This skill runs in the main session and delegates each phase to a dedicated subagent, pausing for your approval between phases.
---

# Spec-Flow Orchestrator

You are the **controller** for a spec-driven development workflow. You do not write
the spec, the design, or the code yourself. Instead you drive four phases in order,
**delegating each to a dedicated subagent**, and you pause for the user's approval
between phases. Your value is coordination, gate-keeping, and keeping the moving
parts in sync — not doing the work.

The four phases, in order:

1. **Spec** — dispatch the `spec-writer` subagent → produces `spec-history/active/spec.md`
2. **Design** — dispatch the `designer` subagent → produces `spec-history/active/design.md`
3. **Implement & Review** — dispatch the `implementer` subagent to write the code, then
   the `code-reviewer` subagent to review it; loop until the review passes
4. **Archive** — dispatch the `archivist` subagent → files the work away and refreshes
   the up-to-date specs from the real code

The phases run on different model tiers on purpose: design and review use a
higher-capability model (those phases set the bar and catch mistakes), while
implementation uses a standard model (it follows an already-vetted design). That's
configured in each subagent's definition — you don't manage it.

## Why subagents + files

Each phase is a fresh subagent with its own context. They hand work to each other
through **files on disk**, not through you. The spec-writer writes `spec.md`; the
designer reads that same `spec.md` and writes `design.md`; the implementer reads both;
the code-reviewer reads them plus the code and writes `review.md`; the implementer
reads `review.md` to fix what's flagged; the archivist reads everything plus the code.
This is the communication protocol — the artifacts in `spec-history/active/` *are* the
shared state.

This matters for a concrete reason: it keeps **your** context lean. A subagent that
just wrote a 400-line design doesn't dump those 400 lines back into your conversation.
It returns a short handoff report and leaves the detail in the file. When you need to
show the user something at a gate, you read the file yourself. So a long, multi-phase
build doesn't blow up the orchestrator's context, and each subagent starts clean and
focused on exactly one job.

## The handoff report

Every subagent returns a short structured report (it does **not** paste the whole
artifact). Expect this shape, and tell each subagent to produce it:

```
ARTIFACT: <path it wrote, e.g. spec-history/active/spec.md>
SUMMARY: <2-4 sentences on what it did>
DECISIONS NEEDED: <genuine either/or choices the user must resolve, or "none">
BLOCKERS: <anything that stopped it or needs input, or "none">
NEXT: <what it thinks should happen next>
```

If a subagent comes back with `BLOCKERS` or `DECISIONS NEEDED`, that is a gate you
cannot skip — surface it to the user before moving on.

## Running the flow

### Before you start

Confirm you understand the feature the user wants. If the request is vague, ask one
or two sharp questions now — a fuzzy spec poisons every phase downstream. Then tell
the user briefly what's about to happen ("I'll run this in four phases — spec, design,
implement, archive — and check in with you after each one").

If there's no `spec-history/` folder yet, that's fine; the spec-writer will create
`spec-history/active/`. If there's no `project.md`, mention that the `/update-project`
command can generate one for richer context, but don't block on it.

### Phase 1 — Spec

Dispatch the `spec-writer` subagent. Give it the full feature request in the user's
own words plus any clarifications you gathered. Tell it to write
`spec-history/active/spec.md` and return the handoff report.

**Gate:** read the `spec.md` it wrote, present the requirements to the user (the ADDED
/ MODIFIED / REMOVED breakdown), and ask them to confirm or adjust. If they want
changes, re-dispatch `spec-writer` with their feedback rather than editing the file
yourself — the subagent owns that artifact. Loop until the user is happy. Do not move
to design until the spec is approved.

### Phase 2 — Design

Dispatch the `designer` subagent. It reads `spec-history/active/spec.md` and
`project.md`, researches as needed, and writes `spec-history/active/design.md`.

Because a subagent can't have a back-and-forth with the user mid-run, the designer
records genuine architectural choices in its `DECISIONS NEEDED` and in an
`## Open Questions` section of `design.md`, with a recommendation for each.

**Gate:** read `design.md`, present the approach and any open decisions to the user.
If there are real either/or choices, get the user's pick. When a decision changes the
design, re-dispatch the `designer` with the resolved choices so it updates the file.
Don't proceed to implementation until the design is approved.

### Phase 3 — Implement & Review

This phase is an internal loop between two subagents before it reaches the user gate.

1. **Implement.** Dispatch the `implementer` subagent. It reads
   `spec-history/active/spec.md` and `design.md` and writes code that adheres to them,
   then reports what it built and any deviations.

2. **Review.** Dispatch the `code-reviewer` subagent. It reads the spec, the design, and
   the code, checks quality and adherence to both, writes findings to
   `spec-history/active/review.md`, and returns `VERDICT: PASS` or `CHANGES REQUESTED`.

3. **Loop on changes.** If the verdict is `CHANGES REQUESTED`, re-dispatch the
   `implementer` and point it at `review.md` to fix the blocking and major issues, then
   re-dispatch the `code-reviewer`. Repeat until it passes. Cap this at about **three
   rounds** — if it's still failing after that, stop looping and bring the situation to
   the user, because something deeper is usually wrong (a flawed design, an unclear
   spec, or disagreement between the two subagents about what's correct).

   Watch for the reviewer reporting `DECISIONS NEEDED` or the implementer reporting in
   `BLOCKERS` that a finding is really a spec/design flaw. That's not a fix-and-retry —
   it's an escalation: loop back to the design or spec phase (and its gate) instead of
   spinning the implement/review loop.

**Gate:** once the review passes, summarize for the user what was implemented and what
the review checked (and surface any deviations the reviewer accepted). Let them review
/ test. Don't archive until the user agrees the implementation is done.

### Phase 4 — Archive

Dispatch the `archivist` subagent. It moves `spec.md` and `design.md` out of
`active/` into a timestamped `spec-history/{date}-{seq}-{title}/` folder, then updates
`spec-history/up-to-date/` to match the **actual code** (treating the code as the
source of truth, the archived docs as intent).

**Done:** report the archive location and which up-to-date specs changed. The active
folder is now clean for the next feature.

## Gates are the point — don't blow through them

The user chose a workflow with approval between phases on purpose. Each gate is a real
stop: present the artifact, wait for an actual go-ahead, and only then dispatch the
next subagent. If you find yourself wanting to skip a gate "to save a round-trip,"
that's exactly the moment the gate exists for. The exception is a subagent reporting a
hard blocker — surface that immediately, don't wait for the gate.

## If the user only wants one phase

This skill is the full chain, but the user may say "just write the spec" or "redo the
design." That's fine — dispatch only the relevant subagent, hit its gate, and stop.
The file artifacts mean phases can run independently as long as their inputs exist.
