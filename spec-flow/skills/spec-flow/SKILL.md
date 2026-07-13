---
name: spec-flow
description: Spec-driven workflow orchestrator. Use this whenever the user wants to build a non-trivial feature, change, or capability in a codebase that follows the spec → design → implement → archive process (look for a spec-history/ folder). Trigger it when the user says things like "spec out and build X", "let's add feature Y", "I want to implement Z properly", "run the spec flow for…", or describes a substantial requirement they want turned into code with a paper trail — even if they don't name the workflow. This skill runs in the main session and delegates each phase to a dedicated subagent, pausing for your approval between phases.
---
# Spec-Flow Orchestrator

## Codex installation note

Skill runs in Codex: phase agents must exist as Codex custom-agent TOML files. `spec-flow-*` custom agents not installed yet? Run `spec-flow-installer` skill first, choose project or user scope. Installer translates bundled Claude-style subagents into Codex custom agents.

In Codex, use these installed custom agents for phases, even where this source file uses shorter Claude subagent names:

- spec writer: `spec-flow-spec-writer`
- designer: `spec-flow-designer`
- implementer: `spec-flow-implementer`
- code reviewer: `spec-flow-code-reviewer`
- archivist: `spec-flow-archivist`

You **controller** for spec-driven dev workflow. Don't write spec, design, or code yourself. Drive four phases in order, **delegating each to dedicated subagent**, pause for user approval between phases. Your value: coordination, gate-keeping, keep moving parts in sync — not doing work.

The four phases, in order:

1. **Spec** — dispatch the `spec-writer` subagent → produces `spec-history/active/spec.md`
2. **Design** — dispatch the `designer` subagent → produces `spec-history/active/design.md`
3. **Implement & Review** — split design's task breakdown into parallel waves; per task dispatch `implementer` then `code-reviewer`, looping till pass; run independent tasks concurrently on separate worktrees, then one integration review
4. **Archive** — dispatch `archivist` subagent → files work away, refreshes up-to-date specs from real code

Phases run different model tiers on purpose: design + review use higher-capability model (set bar, catch mistakes), implementation uses standard model (follows already-vetted design). Configured in each subagent's definition — you don't manage it.

## Why subagents + files

Each phase = fresh subagent, own context. Hand work to each other through **files on disk**, not through you. spec-writer writes `spec.md`; designer reads same `spec.md`, writes `design.md`; implementer reads both; code-reviewer reads them + code, reports findings straight back to you; you relay blocking + major findings to implementer on fix round; archivist reads everything + code. Persistent artifacts in `spec-history/active/` (`spec.md`, `design.md`) *are* shared state. Review findings deliberately **not** persisted to file — flow through you so you stay single point of control over implement/review loop.

Concrete reason: keeps **your** context lean. Subagent that just wrote 400-line design doesn't dump those 400 lines back into your conversation. Returns short handoff report, leaves detail in file. Need show user something at gate? Read file yourself. Long multi-phase build doesn't blow up orchestrator's context; each subagent starts clean, focused on exactly one job.

## The handoff report

Every subagent returns short structured report (does **not** paste whole artifact). Expect this shape, tell each subagent to produce it:

```
ARTIFACT: <path it wrote, e.g. spec-history/active/spec.md>
SUMMARY: <2-4 sentences on what it did>
DECISIONS NEEDED: <genuine either/or choices the user must resolve, or "none">
BLOCKERS: <anything that stopped it or needs input, or "none">
NEXT: <what it thinks should happen next>
```

Subagent comes back with `BLOCKERS` or `DECISIONS NEEDED`? Gate you cannot skip — surface to user before moving on.

## Running the flow

### Before you start

Confirm you understand feature user wants. Request vague? Ask one or two sharp questions now — fuzzy spec poisons every phase downstream. Then tell user briefly what's about to happen ("I'll run this in four phases — spec, design, implement, archive — and check in with you after each one").

No `spec-history/` folder yet? Fine — spec-writer creates `spec-history/active/`. No `project.md`? Mention `/update-project` command can generate one for richer context, but don't block on it.

### Phase 1 — Spec

Dispatch `spec-writer` subagent. Give it full feature request in user's own words + any clarifications gathered. Tell it write `spec-history/active/spec.md`, return handoff report.

**Gate — stop and wait:** read `spec.md` it wrote, present requirements to user (ADDED / MODIFIED / REMOVED breakdown), then **stop, explicitly ask user confirm spec before going further.** Don't dispatch designer same turn — end message with question, wait for reply. Want changes? Re-dispatch `spec-writer` with their feedback, don't edit file yourself — subagent owns that artifact. Loop till user explicitly approves. Only explicit go-ahead opens design phase.

### Phase 2 — Design

Dispatch `designer` subagent. Reads `spec-history/active/spec.md` + `project.md`, researches as needed, writes `spec-history/active/design.md`.

Subagent can't back-and-forth with user mid-run, so designer records genuine architectural choices in `DECISIONS NEEDED` + `## Open Questions` section of `design.md`, with recommendation for each.

**Gate — stop and wait:** read `design.md`, present approach + open decisions to user, then **stop, explicitly ask user confirm design.** Don't dispatch implementer same turn — end message with question, wait for reply. Real either/or choices? Get user's pick. Decision changes design? Re-dispatch `designer` with resolved choices, updates file. Loop till user explicitly approves. Don't proceed implementation till design approved.

### Phase 3 — Implement & Review

**Acknowledgement gate — stop, wait before any code written:** approved design does *not* auto-start implementation. Before dispatching any `implementer`, **stop, explicitly ask user acknowledge you're about to begin building.** End message with that question, wait for reply. Only once user acknowledges, start below.

After acknowledgement, this phase is your coordination job: read the plan, schedule the tasks, run each task's own implement ⇄ review loop, run those loops in **parallel** where the plan allows, then integrate.

#### Step 0 — read the plan, build waves

Read `## Task Breakdown` in `spec-history/active/design.md`: tasks, each task's **files owned**, and its **depends-on** edges. Group into **waves** by dependency (topological levels): a task is runnable once all its deps are done; every runnable task forms the current wave and runs together. Sequential feature (one task, or a pure chain)? Every wave has one task — this degrades to the old single loop, which is fine.

Sanity-check ownership before spawning: any two tasks in the same wave whose owned files overlap are a design bug (parallel work would collide on merge). Don't paper over it — bounce back to the `designer` to fix the split, or serialize the two by treating one as depending on the other.

#### Step 1 — run each wave

For each wave, one task at a time is *not* the goal — run the wave's tasks **concurrently**:

1. **Isolate.** Per task, create a worktree + branch off the current base:
   `git worktree add ../spec-flow-<taskID> -b spec-flow/<taskID>`. That path is the task's sandbox.

2. **Implement (parallel).** Dispatch one `implementer` per task **in a single message (multiple Agent calls) so they run concurrently.** Each dispatch names: the task ID + scope, the **files it owns**, and its **worktree path** — tell it to do all edits there and touch nothing outside its owned set.

3. **Review (per task).** As each implementer returns, dispatch its `code-reviewer` for that task — tell it *single-task* mode, give the worktree path + branch, and the requirements/design components that task covers. Reviewers for different tasks can run concurrently too.

4. **Loop per task.** `CHANGES REQUESTED`? Re-dispatch that task's `implementer` (same worktree), **relaying the reviewer's blocking + major findings inline**, then re-review. Per task cap ~**three rounds**. Each task's loop is independent — one task looping doesn't block a sibling that already passed.

5. **Merge on pass.** Task's review PASSES? Merge its branch into the base (`git merge --no-ff spec-flow/<taskID>`), then `git worktree remove` its sandbox. A clean merge is expected because ownership is disjoint; a **merge conflict means the task breakdown was wrong** — stop, escalate to `designer`, don't hand-resolve.

Only when every task in a wave is merged do you start the next wave (its tasks may build on this wave's code).

#### Step 2 — integration review

All waves merged onto the base? Run one **integration** pass over the combined result: dispatch `implementer` to reconcile the seams (wiring, shared config/registration, cross-task tests) if anything needs it, then dispatch `code-reviewer` in *integration* mode over the full combined diff. Loop till pass (three-round cap). This catches what only surfaces when independently-built pieces meet.

#### Escalation (any point in the phase)

Reviewer reports `DECISIONS NEEDED`, or implementer reports in `BLOCKERS`, that a finding is really a spec/design flaw — **not** fix-and-retry. Stop that task, loop back to design or spec phase (+ its gate). A design-level flaw can invalidate the whole wave plan, so re-derive waves after the design changes. Any task's loop hitting the round cap without converging → stop, bring to user; something deeper is wrong.

**Gate:** integration review passes? Summarize for user: what each task built, how they were split/parallelized, what the reviews checked (surface any deviations reviewers accepted). Let them review/test. Don't archive till user agrees implementation done.

### Phase 4 — Archive

Dispatch `archivist` subagent. Moves `spec.md` + `design.md` out of `active/` into timestamped `spec-history/{date}-{seq}-{title}/` folder, updates `spec-history/up-to-date/` to match **actual code** (code = source of truth, archived docs = intent).

**Done:** report archive location + which up-to-date specs changed. Active folder now clean for next feature.

## Gates are the point — don't blow through them

User chose workflow with approval between phases on purpose. Each gate real stop: present artifact, wait for actual go-ahead, only then dispatch next subagent. Find yourself wanting skip gate "to save round-trip"? That's exactly moment gate exists for. Exception: subagent reporting hard blocker — surface immediately, don't wait for gate.

**One** sanctioned way run without these gates: **auto mode** (below) — user opts in explicitly, replaces human gates with your own judgment, not with nothing. Absent that opt-in, gates hold.

## Auto mode — gateless, no verification

User can run whole chain **without stopping at human gates**. Trigger auto mode when they say things like "auto mode", "run it end to end", "no gates", "don't stop to ask me", or "spec out and build X on auto". Confirm you understood feature (same one or two sharp questions as always — fuzzy requirement poisons every phase, auto mode nobody catches it at gate), then run all four phases in sequence, same flow, without pausing for approval between them.

**Human gates don't get replaced by anything — they're just skipped.** Spec and design verification are bypassed entirely: no alignment check against the original requirement, no re-dispatch loop for misalignment. Read what spec-writer/designer produced, and if it looks reasonable, move straight to the next phase.

Run it like this:

1. **Spec.** Dispatch `spec-writer` as normal.
2. **Design.** Once `spec.md` is written, dispatch `designer` immediately — no verification, no user gate.
3. **Implement & review.** Once `design.md` is written, skip the acknowledgement gate and run the full Phase 3 machinery above — build waves from the task breakdown, spawn parallel implementers on worktrees, per-task implement ⇄ `code-reviewer` loops, merge, then integration review (all three-round caps included). Parallelism and per-task loops are already automated; auto mode only drops the human gates around them.
4. **Archive.** Review passes? Dispatch `archivist` without waiting for user to declare implementation done.

**Questions from spec-writer or designer are yours to answer, not the user's.** Handoff report comes back with `DECISIONS NEEDED` — an assumption it flagged, an either/or it couldn't resolve alone? Don't stop, don't dispatch anything to check it: read the context, make the call yourself the way the user would want, note the decision in your progress update, keep going. Designer's architectural fork already carries a recommendation? Take it, move on.

**What still stops auto mode** — genuine failures flow can't paper over:
- Subagent reporting hard `BLOCKERS` (unreadable artifact, can't run tests, missing input) — surface immediately.
- A `DECISIONS NEEDED` that isn't really yours to make — hinges on a preference only the user has an opinion on, or the requirement is genuinely contradictory at its core rather than just underspecified in a fillable way. Ask rather than guess.
- Any implement/review loop hitting round cap without converging — signals something deeper (flawed requirement, spec/design disagreement); stop, report.
- Implement/review escalation already defined above (finding really spec/design flaw) — loop back to right phase, don't spin.

Report progress as you go so user can interrupt, give single summary at end: what built, what reviewer checked, which decisions you made along the way, archive location, which up-to-date specs changed. Auto mode trades approval gates and verification for speed — does **not** trade away surfacing real blockers or decisions genuinely outside your call.

## If the user only wants one phase

This skill = full chain, but user may say "just write the spec" or "redo the design." Fine — dispatch only relevant subagent, hit its gate, stop. File artifacts mean phases can run independently as long as inputs exist.