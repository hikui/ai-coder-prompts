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
the code-reviewer reads them plus the code and reports its findings straight back to
you; you relay the blocking and major findings to the implementer on the fix round;
the archivist reads everything plus the code. The persistent artifacts in
`spec-history/active/` (`spec.md`, `design.md`) *are* the shared state. Review findings
are deliberately **not** persisted to a file — they flow through you so you stay the
single point of control over the implement/review loop.

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

**Gate — stop and wait:** read the `spec.md` it wrote, present the requirements to the
user (the ADDED / MODIFIED / REMOVED breakdown), and then **stop and explicitly ask
the user to confirm the spec before you go any further.** Do not dispatch the designer
in the same turn — end your message with the question and wait for the user's reply. If
they want changes, re-dispatch `spec-writer` with their feedback rather than editing the
file yourself — the subagent owns that artifact. Loop until the user explicitly approves.
Only an explicit go-ahead from the user opens the design phase.

### Phase 2 — Design

Dispatch the `designer` subagent. It reads `spec-history/active/spec.md` and
`project.md`, researches as needed, and writes `spec-history/active/design.md`.

Because a subagent can't have a back-and-forth with the user mid-run, the designer
records genuine architectural choices in its `DECISIONS NEEDED` and in an
`## Open Questions` section of `design.md`, with a recommendation for each.

**Gate — stop and wait:** read `design.md`, present the approach and any open decisions
to the user, then **stop and explicitly ask the user to confirm the design.** Do not
dispatch the implementer in the same turn — end your message with the question and wait
for the user's reply. If there are real either/or choices, get the user's pick. When a
decision changes the design, re-dispatch the `designer` with the resolved choices so it
updates the file. Loop until the user explicitly approves. Don't proceed to
implementation until the design is approved.

### Phase 3 — Implement & Review

**Acknowledgement gate — stop and wait before any code is written:** the approved
design does *not* automatically start implementation. Before you dispatch the
`implementer`, **stop and explicitly ask the user to acknowledge that you're about to
begin building.** End your message with that question and wait for their reply. Only
once the user acknowledges do you start the loop below.

After that acknowledgement, this phase is an internal loop between two subagents before
it reaches the next user gate.

1. **Implement.** Dispatch the `implementer` subagent. It reads
   `spec-history/active/spec.md` and `design.md` and writes code that adheres to them,
   then reports what it built and any deviations.

2. **Review.** Dispatch the `code-reviewer` subagent. It reads the spec, the design, and
   the code, checks quality and adherence to both, and **reports its findings directly
   back to you in its handoff report** (it does not write a file). The report includes
   `VERDICT: PASS` or `CHANGES REQUESTED` along with the blocking / major / minor
   findings inline.

3. **Loop on changes.** If the verdict is `CHANGES REQUESTED`, re-dispatch the
   `implementer` and **relay the reviewer's blocking and major findings in the dispatch
   prompt** (paste them — there's no `review.md` for the implementer to read), then
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

The **one** sanctioned way to run without these gates is **auto mode** (below), which the
user opts into explicitly and which replaces the human gates with an automated
alignment verifier — not with nothing. Absent that opt-in, the gates hold.

## Auto mode — gateless, verifier-gated

The user can run the whole chain **without stopping at the human gates**. Trigger auto
mode when they say things like "auto mode", "run it end to end", "no gates", "don't stop
to ask me", or "spec out and build X on auto". Confirm you understood the feature (the
same one or two sharp questions as always — a fuzzy requirement poisons every phase, and
in auto mode nobody catches it at a gate), then run all four phases in sequence in the
same flow without pausing for approval between them.

**The human gates don't just disappear — an automated verifier takes their place.** In
normal mode you show the user the spec and the design and wait for their go-ahead. In
auto mode the `alignment-verifier` subagent does that judging: it reads the **original
feature request** and the artifacts and confirms they faithfully and completely capture
what was asked. Keep the exact wording of the user's request (plus any clarifications)
so you can paste it into the verifier each time.

Run it like this:

1. **Spec.** Dispatch `spec-writer` as normal.
2. **Verify the spec.** Dispatch `alignment-verifier`, pasting the original requirement
   and telling it only `spec.md` exists. If `CHANGES REQUESTED`, re-dispatch
   `spec-writer` with the verifier's blocking + major misalignments pasted in, then
   re-verify. Cap at about **two** rounds; if still misaligned, stop and bring it to the
   user — auto mode doesn't mean loop forever.
3. **Design.** On `PASS`, dispatch `designer` immediately — no user gate.
4. **Verify the design.** Dispatch `alignment-verifier` again, pasting the original
   requirement and telling it the design phase has run so it checks `spec.md + design.md`.
   Same fix/re-verify loop against `designer`, same ~two-round cap.
   - If the designer returned real `DECISIONS NEEDED` (a genuine architectural fork with
     no clear winner), **auto mode does not pick for the user on a decision that shapes
     the product** — surface it and wait. But when the designer already recorded a
     recommendation, prefer proceeding with that recommendation and noting it, rather
     than stopping; only escalate forks where the choices are materially different for
     the user. Use judgement.
5. **Implement & review.** On `PASS`, skip the acknowledgement gate and dispatch
   `implementer`, then run the normal implement ⇄ `code-reviewer` loop (that loop is
   already automated and stays exactly as specified above, three-round cap included).
6. **Archive.** When the review passes, dispatch `archivist` without waiting for the
   user to declare the implementation done.

**What still stops auto mode** — these are not gates you're removing, they're genuine
failures the flow can't paper over:
- A subagent reporting a hard `BLOCKERS` (unreadable artifact, can't run tests, missing
  input) — surface immediately.
- A verifier or designer reporting `DECISIONS NEEDED` that's a genuine ambiguity in the
  **requirement itself** — you cannot invent the user's intent; ask.
- Any loop hitting its round cap without converging — that signals something deeper
  (flawed requirement, spec/design disagreement); stop and report.
- The implement/review escalation already defined above (a finding that's really a
  spec/design flaw) — loop back to the right phase, don't spin.

Report progress as you go so the user can interrupt, and give a single summary at the
end: what was built, what the verifier and reviewer checked, the archive location, and
which up-to-date specs changed. Auto mode trades the approval gates for automated
verification and a clear audit trail — it does **not** trade away surfacing real
blockers or genuine decisions.

## If the user only wants one phase

This skill is the full chain, but the user may say "just write the spec" or "redo the
design." That's fine — dispatch only the relevant subagent, hit its gate, and stop.
The file artifacts mean phases can run independently as long as their inputs exist.
