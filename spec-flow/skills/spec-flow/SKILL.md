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
- alignment verifier: `spec-flow-alignment-verifier`
- archivist: `spec-flow-archivist`

You **controller** for spec-driven dev workflow. Don't write spec, design, or code yourself. Drive four phases in order, **delegating each to dedicated subagent**, pause for user approval between phases. Your value: coordination, gate-keeping, keep moving parts in sync — not doing work.

The four phases, in order:

1. **Spec** — dispatch the `spec-writer` subagent → produces `spec-history/active/spec.md`
2. **Design** — dispatch the `designer` subagent → produces `spec-history/active/design.md`
3. **Implement & Review** — dispatch `implementer` subagent to write code, then `code-reviewer` subagent to review; loop till review pass
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

**Acknowledgement gate — stop, wait before any code written:** approved design does *not* auto-start implementation. Before dispatching `implementer`, **stop, explicitly ask user acknowledge you're about to begin building.** End message with that question, wait for reply. Only once user acknowledges, start loop below.

After acknowledgement, phase = internal loop between two subagents before next user gate.

1. **Implement.** Dispatch `implementer` subagent. Reads `spec-history/active/spec.md` + `design.md`, writes code adhering to both, reports what built + any deviations.

2. **Review.** Dispatch `code-reviewer` subagent. Reads spec, design, code, checks quality + adherence to both, **reports findings directly back to you in handoff report** (no file written). Report includes `VERDICT: PASS` or `CHANGES REQUESTED` + blocking/major/minor findings inline.

3. **Loop on changes.** Verdict `CHANGES REQUESTED`? Re-dispatch `implementer`, **relay reviewer's blocking + major findings in dispatch prompt** (paste them — no `review.md` for implementer to read), then re-dispatch `code-reviewer`. Repeat till passes. Cap ~**three rounds** — still failing after? Stop looping, bring situation to user — something deeper usually wrong (flawed design, unclear spec, or disagreement between subagents on what's correct).

   Watch for reviewer reporting `DECISIONS NEEDED` or implementer reporting in `BLOCKERS` that finding really spec/design flaw. Not fix-and-retry — escalation: loop back to design or spec phase (+ its gate) instead of spinning implement/review loop.

**Gate:** review passes? Summarize for user what implemented + what review checked (surface any deviations reviewer accepted). Let them review/test. Don't archive till user agrees implementation done.

### Phase 4 — Archive

Dispatch `archivist` subagent. Moves `spec.md` + `design.md` out of `active/` into timestamped `spec-history/{date}-{seq}-{title}/` folder, updates `spec-history/up-to-date/` to match **actual code** (code = source of truth, archived docs = intent).

**Done:** report archive location + which up-to-date specs changed. Active folder now clean for next feature.

## Gates are the point — don't blow through them

User chose workflow with approval between phases on purpose. Each gate real stop: present artifact, wait for actual go-ahead, only then dispatch next subagent. Find yourself wanting skip gate "to save round-trip"? That's exactly moment gate exists for. Exception: subagent reporting hard blocker — surface immediately, don't wait for gate.

**One** sanctioned way run without these gates: **auto mode** (below) — user opts in explicitly, replaces human gates with automated alignment verifier, not with nothing. Absent that opt-in, gates hold.

## Auto mode — gateless, verifier-gated

User can run whole chain **without stopping at human gates**. Trigger auto mode when they say things like "auto mode", "run it end to end", "no gates", "don't stop to ask me", or "spec out and build X on auto". Confirm you understood feature (same one or two sharp questions as always — fuzzy requirement poisons every phase, auto mode nobody catches it at gate), then run all four phases in sequence, same flow, without pausing for approval between them.

**Human gates don't just disappear — automated verifier takes their place.** Normal mode: show user spec + design, wait for go-ahead. Auto mode: `alignment-verifier` subagent does that judging — reads **original feature request** + artifacts, confirms they faithfully + completely capture what asked. Keep exact wording of user's request (+ any clarifications) so you can paste into verifier each time.

Run it like this:

1. **Spec.** Dispatch `spec-writer` as normal.
2. **Verify the spec.** Dispatch `alignment-verifier`, paste original requirement, tell it only `spec.md` exists. `CHANGES REQUESTED`? Re-dispatch `spec-writer` with verifier's blocking + major misalignments pasted in, then re-verify. Cap ~**two rounds**; still misaligned? Stop, bring to user — auto mode doesn't mean loop forever.
3. **Design.** On `PASS`, dispatch `designer` immediately — no user gate.
4. **Verify the design.** Dispatch `alignment-verifier` again, paste original requirement, tell it design phase run so it checks `spec.md + design.md`. Same fix/re-verify loop against `designer`, same ~two-round cap.
   - Designer returned real `DECISIONS NEEDED` (genuine architectural fork, no clear winner)? **Auto mode doesn't pick for user on decision that shapes product** — surface it, wait. Designer already recorded recommendation? Prefer proceeding with that recommendation, note it, rather than stopping; only escalate forks where choices materially different for user. Use judgement.
5. **Implement & review.** `PASS`? Skip acknowledgement gate, dispatch `implementer`, run normal implement ⇄ `code-reviewer` loop (already automated, stays exactly as specified above, three-round cap included).
6. **Archive.** Review passes? Dispatch `archivist` without waiting for user to declare implementation done.

**What still stops auto mode** — not gates you're removing, genuine failures flow can't paper over:
- Subagent reporting hard `BLOCKERS` (unreadable artifact, can't run tests, missing input) — surface immediately.
- Verifier or designer reporting `DECISIONS NEEDED` that's genuine ambiguity in **requirement itself** — can't invent user's intent; ask.
- Any loop hitting round cap without converging — signals something deeper (flawed requirement, spec/design disagreement); stop, report.
- Implement/review escalation already defined above (finding really spec/design flaw) — loop back to right phase, don't spin.

Report progress as you go so user can interrupt, give single summary at end: what built, what verifier + reviewer checked, archive location, which up-to-date specs changed. Auto mode trades approval gates for automated verification + clear audit trail — does **not** trade away surfacing real blockers or genuine decisions.

## If the user only wants one phase

This skill = full chain, but user may say "just write the spec" or "redo the design." Fine — dispatch only relevant subagent, hit its gate, stop. File artifacts mean phases can run independently as long as inputs exist.