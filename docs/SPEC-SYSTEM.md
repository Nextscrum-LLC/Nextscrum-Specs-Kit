<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# SPEC-SYSTEM.md: How we define, build, and ship work

> This is the one page to read first. It explains how an idea becomes
> running code, what each artifact is for, where every file lives, and what
> to do in the three situations you hit every week (a new requirement, a
> bug, a requirement change).

---

## 0. Who this is for

A developer (or a future you) with general web and mobile background, new
to *this specific* project. After reading this page you should be able to
add a requirement, build it, and ship it without guessing where anything
goes.

We borrowed the good ideas from public Spec-Driven Development (SDD)
toolkits (GitHub Spec Kit, AWS Kiro, OpenSpec, BMAD) and shaped them to a
small-team product. Section 8 compares them directly.

---

## 1. Glossary (every short form spelled out)

| Short form | Full name | Plain meaning |
|---|---|---|
| SDD | Spec-Driven Development | write the spec first, build from it |
| SDLC | Software Development Life Cycle | the whole path: idea to running in production |
| ADR | Architecture Decision Record | one file = one big technical decision plus why |
| EARS | Easy Approach to Requirements Syntax | the "WHEN ... THE SYSTEM SHALL ..." sentence format |
| UAT | User Acceptance Testing | checks you run by hand to call something done |
| PRD | Product Requirements Document | the "what we are building and why" document |
| FK | Foreign Key | a database link from one table to another |
| CI | Continuous Integration | automated checks that run on every push |

The project glossary (product vocabulary, not acronyms) lives in
`docs/glossary.md`.

---

## 2. The lifecycle (the loop you hold in your head)

Everything follows one loop. Each box has one job and one arrow out, so
when you wonder "where does this thing go?", you ask "which stage?" and
there is exactly one answer.

```
  (1) Rules ──▶ (2) Specify ──▶ (3) Plan ──▶ (4) Analyze ──▶ (5) Build ──▶ (6) Record Facts
   the laws      what + why      how          check it        code +        update the
   (R1..RN)      (SPEC-NNN)      (plan.md)    agrees          tests         Architecture docs
       ▲                                       (read-only)        │            so they stay true
       │                                                          │
       │         (5) Build runs through the delivery pipeline:    │
       │         branch ▶ commit ▶ version ▶ review ▶ QA ▶ deploy │
       │                                                          │
       └──────────────── (7) Continue: HANDOFF.md + sessions/ wraps every session ◀────────┘
```

### Stage by stage (what, why, example)

**(1) Rules.** The non-negotiable laws every feature obeys (`R1`..`RN` in
`CLAUDE.md`). Other toolkits call this a "constitution."
- *Why:* a stable floor means decisions do not get re-argued every feature.
- *Example:* a security rule and a voice/style rule constrain how a feature
  is built before a line is written.

**(2) Specify.** Write the *what + why* as a spec (`SPEC-NNN`). Acceptance
criteria go here, in EARS sentences (Section 5).
- *Why:* a fuzzy ask produces fuzzy code. A precise spec is testable.
- *Example:* SPEC-000 (export report as CSV) states the trigger, the file
  shape, and the error behavior before any UI changes.

**(3) Plan.** The *how*: the design, the contracts (interface shapes,
database changes, the state machine), the files to change, and the test
plan. Lives in `plan.md`.
- *Why:* under-specified contracts are the classic source of multi-hour bug
  clusters. A written contract catches that on paper.
- *Example:* SPEC-000's plan defines the export endpoint contract and the
  CSV column order.

**(4) Analyze.** A read-only check *before* coding. Read spec + plan + tasks
together and report where they contradict each other or break a rule. It
changes nothing; it produces a report you act on.
- *Why:* finding a contradiction in a document is minutes; finding it in
  running code is hours.
- *Example:* "Task T4 has no acceptance criterion" or "the plan violates a
  security rule" surfaces here, not after shipping.

**(5) Build.** Write the code and the tests. This is where the delivery
pipeline runs (Section 7).
- *Why:* tests prove the EARS criteria, one assertion per criterion.
- *Example:* each task in `tasks.md` becomes a commit with a test that
  asserts its acceptance criterion.

**(6) Record Facts.** When the feature lands, update the Architecture docs
(ADRs in `docs/decisions/`, design specs in `docs/architecture/`) so they
state what is now true. This is the step that is easiest to skip.
- *Why:* skipping it is the exact gap that leaves a decision missing from
  the ADR that should record it. Recording facts keeps the truth in one
  place.
- *Example:* a commit that adds a new provider also edits the relevant ADR
  to record it.

**(7) Continue.** Across sessions, `HANDOFF.md` plus a `docs/sessions/`
log carry state so work survives a break or a context compaction.

### The Analyze checklist (run before writing code)

Analyze is read-only. Read `spec.md`, `plan.md`, and `tasks.md` together
and answer each question. Any "no" is a fix to make on paper before code.

1. Does every acceptance criterion in `spec.md` have a matching contract
   in `plan.md` and a test in the test plan?
2. Does every task in `tasks.md` name the acceptance criterion it
   satisfies (no orphan tasks)?
3. Does the plan break any rule under "Rules touched" (or any `R1..RN`)?
   A rule conflict is a blocker, not a thing to explain away.
4. Are all relationships valid (depends-on / supersedes point at real
   specs; no cycle)? `audit:rules` checks this mechanically, but eyeball
   it too.
5. Does `plan.md` list the Facts to Record (which Architecture docs update
   on landing)?
6. Any ambiguity, duplication, or gap across the three files?

For a cross-layer spec, run the cross-layer trace check after code as the
runtime counterpart to this paper check.

---

## 3. Names and identifiers

One prefix per *kind* of thing, so they never collide.

| Loop stage | Thing | Identifier | Example |
|---|---|---|---|
| (1) Rules | a project law | `R1`..`RN` | `R3` |
| (2) Specify | a spec (what + why) | `SPEC-NNN` | `SPEC-000` |
| (3) Plan | how to build that spec | child of the spec | SPEC-000's `plan.md` |
| (4) Tasks | the work units | child of the spec | `SPEC-000 / T1` |
| (6) Record Facts | a decision record | `ADR-NNNN` | `ADR-0002` |

Rules stay `R`; specs are `SPEC`. The two prefixes never collide, so `R3`
(a rule) is never confused with a spec.

The plan and tasks never get their own number. They belong to a spec and
inherit its number. One feature, one number, everything for it grouped.

---

## 4. Where everything lives

```
docs/
  SPEC-SYSTEM.md           <- this guide (read first)
  glossary.md              <- acronym + vocabulary meanings
  requirements.md          <- THE LEDGER: one row per spec (id, title, status, link)
  specs/                   <- one folder per BIG spec
    000-example-feature/
      spec.md   plan.md   tasks.md   tests.md
  decisions/               <- ARCHITECTURE (truth): ADRs, recorded on landing
    0002-example-decision.md
  architecture/            <- ARCHITECTURE (truth): design specs
    example-feature-design.md
  sessions/                <- per-session logs (Continue)
HANDOFF.md                 <- across-session state (Continue)
CLAUDE.md                  <- the Rules (R1..RN)
```

**The ledger stays the single scannable list.** It does not die; it gets
lighter. Each row links to the spec's folder (for big specs) or holds the
whole thing inline (for small ones).

### Folder vs inline (the threshold)

| Gets a folder in `specs/` | Stays inline in the ledger |
|---|---|
| touches 2+ layers (UI / backend / database) | single layer, single file |
| has phases or several tasks | one small change |
| needs contracts, a state machine, or a design | no design needed |
| example: SPEC-000 | example: an icon fix, a copy tweak |

Plain rule: **if it needs a Plan, it gets a folder. If it is a quick fix,
it is one ledger row.**

#### The three-question test (use this when unsure)

Answer three yes/no questions. **Any single YES means a folder.**

1. Does it touch more than one layer (UI / backend / database)?
2. Will it take more than one or two commits (phases, or several tasks)?
3. Does it need a written contract before coding (an interface shape, a
   state machine, a database migration, or a UI design)?

**All three NO means inline:** a single-file change, one or two commits, no
design. When still unsure, start inline; promote to a folder the moment a
second layer or a real contract appears. Promoting is cheap; an empty
folder is junk.

#### Sprints do not get their own tracker doc

A "sprint" is just a set of `SPEC-NNN` entries worked together. The home
for a multi-phase effort is the umbrella spec's **folder** (its `tasks.md`
is the phase tracker), not a separate `docs/sprint-N-*.md` file. No new
standalone sprint docs.

---

## 5. What goes inside each file

### `spec.md` (the what + why)

- Header: id, title, status, owner, date, `Verified by` (the done-gate (R6)
  ladder).
- **Why:** the problem and the value.
- **Acceptance criteria** in EARS (see below).
- **Rules touched:** which `R`-rules apply (feeds Analyze).
- **Relationships:** parent, depends-on, blocks, supersedes (Section 6).

#### EARS in one minute

EARS turns a fuzzy line into a testable sentence. Five templates:

| Situation | Template | Example |
|---|---|---|
| always true | THE SYSTEM SHALL `<behavior>` | The report export SHALL produce a UTF-8 CSV. |
| an event | WHEN `<trigger>` THE SYSTEM SHALL `<response>` | WHEN the user clicks Export the system SHALL stream a CSV download. |
| a state holds | WHILE `<state>` THE SYSTEM SHALL `<behavior>` | WHILE an export is in progress the system SHALL disable the Export button. |
| a guard | IF `<bad case>` THEN THE SYSTEM SHALL `<response>` | IF the report has zero rows THEN the system SHALL return a header-only CSV. |
| feature-gated | WHERE `<feature on>` THE SYSTEM SHALL `<behavior>` | WHERE the locale is set the system SHALL format dates per that locale. |

Each EARS line maps to exactly one test. That is the whole point: fuzzy
becomes testable becomes traceable.

### `plan.md` (the how, build only)

- **Approach:** the design in prose.
- **Contracts:** interface shapes, database changes, the state machine.
- **Files to change.**
- **Facts to Record:** the list of Architecture docs that must be updated
  when this lands (the ripple link, Section 6).
- **Test plan:** each EARS criterion mapped to a test.
- **Analyze notes:** the read-only check result (does the plan satisfy every
  criterion; does it break any rule).

`plan.md` is the plan to *build*. It is not a delivery plan. Delivery is
the same for every feature and lives in Section 7, not here.

### `tasks.md` (the units)

- `T1`, `T2`, `T3` ..., each with: what, files, which acceptance criterion
  it satisfies, status.

### `tests.md` (the coverage matrix)

- The fourth file. One row per acceptance criterion, one column per quality
  dimension (functional, security, accessibility, and the opt-in ones), plus
  the tagged test list (`SPEC-NNN/C#/dimension/case`). A dash is an audited
  skip, not a silent gap. Produced by the clarify pass (`/spec-tests`); the
  method, the dimension axis, and the naming scheme are in
  `docs/TESTING-SYSTEM.md`. Worked example:
  `docs/specs/000-example-feature/tests.md`.

---

## 6. Dependencies (the relationship web)

The system is a graph: things depend on other things. We capture the
relationships as structured fields so they can be checked, not just read.

| Relationship | Where written | Captured | Checked by tooling |
|---|---|---|---|
| Spec to Architecture docs (Facts to Record) | `plan.md` | yes | yes: on landing, the listed docs must be touched |
| Spec to parent / Tasks (children) | `spec.md` / `tasks.md` | yes | yes: a spec cannot be `done` while a child task is open |
| Spec to Rules touched | `spec.md` | yes | yes: referenced `R`-numbers must exist; a file-pattern map infers which rules a change touches; feeds Analyze |
| Spec to Spec (depends-on / blocks / supersedes) | `spec.md` | yes | yes: referenced ids must exist; supersession consistent; cannot go `done` while a depends-on is not done; depends-on loops are rejected (cycle detection) |
| Rule to Rule | prose in `CLAUDE.md` | as prose | no (rarely changes) |

**What we check now:** reference validity, the consistency rules above,
**cycle detection** (a depends-on loop such as A needs B needs A is
rejected), and a cheap **file-pattern rule map** (a changed file path
implies which `R`-rules apply).

### Dependency ordering: three levels

Ordering has three levels, not two. We build the first now; the other two
turn on later from the very same data, with no rework.

| Level | What it gives | Cost | Turn it on when |
|---|---|---|---|
| Cycle detection | rejects a depends-on loop (A needs B needs A) | low (now) | always, as a guardrail |
| Blocked / Ready | each spec shows "blocked by SPEC-NNN" or "ready to start" | low | a team works in parallel, or many specs depend on each other |
| Full topological ordering | the system computes the whole build sequence and critical path | medium to high | formal cross-team scheduling over a large interdependent backlog |

For a small team with a few active specs, cycle detection plus your own
eyes is enough. On a larger multi-module system with a team (for example
an ecommerce platform with admin, super-admin, storefront, API, and mobile
modules), turn on **Blocked / Ready**: it answers "what can I start right
now" without computing a global order. **Full topological ordering** is
program-management territory; add it only if the backlog density actually
demands it.

The size of a codebase does not decide this. Two things do: how many
specs depend on each other at the same time, and how many people work in
parallel. A big system with loosely coupled modules may never need more
than Blocked / Ready.

Because `depends-on` is a structured field, Blocked / Ready is free to
derive whenever you want it, and full ordering sits on top of the same
data. This is why the structure is worth doing properly: the same spec
layout moves to another project unchanged.

---

## 7. Delivery (the second half of the SDLC)

Building a feature happens *through* a delivery pipeline. This is one
global policy, the same for every spec, so it lives here and not in each
plan.

```
branch ▶ commit ▶ version ▶ code review ▶ QA ▶ deploy (staging, then production)
```

The rules for each step already exist in the rule book. They are grouped
here so the whole pipeline is visible in one place:

| Delivery step | Rule(s) | Detail |
|---|---|---|
| Branch | branching (practice) | `feat/` `fix/` `chore/` off `dev` |
| Commit | R3, R4 | Conventional Commits (R4) + no AI attribution (R3) + the pre-commit checklist |
| Version | version bump (practice) | semantic version bump: patch / minor / major |
| Code review | R5 | review markers (R5) + code-review pass |
| QA | R8 | tests prove the criteria (R8) + the auto-run end-to-end suite |
| Done / verify | R6, R8 | the done-gate (R6) + acceptance criteria, tested under R8 |
| Deploy | deploy workflow (practice) | `dev` to staging, `main` to production via CI |

> RESKIN: the R-numbers above mirror this kit's rule book (R1-R14 in
> `CLAUDE.md`). Wire each delivery step to your own rules and CI.

The two halves meet at the finish line: a spec is not `done` until QA and
verify pass (the done-gate (R6) plus the auto-run end-to-end suite), and
Record Facts (stage 6) happens in the same commit that lands the feature.

---

## 8. How this compares to other systems

> This is the compact view. The full comparison (wider field, deeper matrix,
> honest account of where others win) is in [COMPARISON.md](COMPARISON.md).

Read your column top to bottom. We are strong at the top (rules, ledger)
and the bottom (sessions, verify); we were thin in the middle (plan,
analyze, record), which is what this design fills.

| Concept (plain) | Ours | Spec Kit | Kiro | OpenSpec | BMAD |
|---|---|---|---|---|---|
| laws every feature obeys | Rules (R1..RN) | constitution.md | steering files | (none) | (none) |
| what to build + why | spec.md (SPEC-NNN) | spec.md | requirements.md (EARS) | changes/ | PRD |
| how to build (contracts) | plan.md | plan.md | design.md | proposal body | architecture doc |
| break into units | tasks.md | tasks.md | tasks.md | tasks | sprint stories |
| check before coding | Analyze | /analyze | analyze requirements | (none) | QA agent |
| current truth | Architecture (decisions + design) | spec stays truth | the spec files | specs/ (truth) | living docs |
| push decision into truth | Record Facts | regenerate | update spec | archive | (none) |
| state across sessions | HANDOFF + sessions/ | memory/ | (none) | (none) | (none) |
| proof it is done | Verified-by ladder (the done-gate (R6)) | (none) | (none) | (none) | (none) |

What we deliberately did not copy: BMAD's twelve-agent ceremony, and Spec
Kit's auto-regeneration of code from spec (too aggressive for a live
product verified by hand).

---

## 9. Playbooks (do this when ...)

> Live worked example of the artifacts these playbooks produce:
> `docs/specs/000-example-feature/` (with `spec.md` in EARS, `plan.md`,
> `tasks.md`, and `tests.md`).

### A. A new requirement arrives

1. Add a `SPEC-NNN` row to the ledger.
2. Decide folder vs inline (the threshold in Section 4).
3. Write `spec.md`: why, acceptance criteria in EARS, rules touched,
   relationships.
4. If it needs a Plan: write `plan.md` (approach, contracts, files, facts
   to record, test plan), then `tasks.md`.
5. Run **Analyze**: read spec + plan + tasks together, fix every
   contradiction and rule conflict before coding.
6. Build on a `feat/` branch (commit, version, review, QA per Section 7).
7. **Record Facts**: in the landing commit, update every Architecture doc
   listed under "Facts to Record."
8. Move to `done` only when `Verified by` reaches at least
   `NextScrum-manual` (the done-gate (R6)).

### B. A bug appears

1. Add a `SPEC-NNN` row (bugs are small specs). Most stay inline.
2. In `spec.md`, write the bug as an EARS guard: "IF `<bad case>` THEN THE
   SYSTEM SHALL `<correct behavior>`." That sentence is your failing test.
3. Write the test first; confirm it fails (proves the bug).
4. Fix on a `fix/` branch until the test passes.
5. Run the relevant review pass (cross-layer trace for cross-layer changes,
   database review for schema) and the auto-run end-to-end suite (the
   playwright-runner agent).
6. **Record Facts** only if the fix changed a documented decision or
   design; most bug fixes do not.
7. Verify and close (the done-gate (R6)).

### C. A requirement changes (the ripple case)

1. Do not silently edit the old spec. Either update its `spec.md` with the
   change noted, or supersede it with a new `SPEC-NNN` (set the old one's
   status to `superseded` so the consistency check stays happy).
2. Re-check **Relationships**: which specs depend-on or block this one?
   Update their fields.
3. Update `plan.md`, especially **Facts to Record**: the change almost
   always shifts which Architecture docs must move.
4. Run **Analyze** again. A changed requirement is the most common source
   of a now-contradictory plan.
5. Build, then **Record Facts** so the Architecture docs match the new
   reality.
6. Verify and close.

The `spec-change-ripple` check enforces step 1 mechanically: editing a spec's
`spec.md` without also updating its `tasks.md` and `tests.md` warns, so the
ripple cannot be skipped silently.

### D. A pure decision (no feature) is made

1. Write or update an ADR in `docs/decisions/` directly. A decision with no
   code is a Record-Facts action on its own.
2. If the decision changes a rule, update `CLAUDE.md` and the audit script
   that pins it (R-rules are advisory until pinned in `audit:rules`).

---

## 10. What the tooling enforces

The system has two layers by design: a set of mechanical gates that run on
every commit, and a set of practices the team runs as discipline. Both are
deliberate. The gates catch what people forget under fatigue; the practices
cover the steps a gate cannot judge for itself (an interactive question set,
a human reading running behavior). Knowing which layer a step lives in tells
you whether the machine has your back or whether you do.

**Mechanical gates (enforced by `npm run audit:rules` and the husky
hooks):**

- The `specs/` folder convention, with SPEC-000 as the worked example
  (`spec.md` + `plan.md` + `tasks.md` + `tests.md`).
- Dependency-integrity checks: dangling SPEC-reference detection across the
  ledger, depends-on **cycle detection**, and **Facts-to-Record target
  existence** (the listed Architecture docs must exist).
- The file-pattern rule map (a changed file path implies which rules apply).
- The done-gate (R6): a spec cannot move to `done` until `Verified by`
  reaches at least `NextScrum-manual`.
- The delivery gates: the commit checklist, the version bump, the
  review-marker rule (R5), and the coverage rule (R8) all fire at commit
  time.
- The voice rules (R1-R2: no em dashes, no banned words) and the no-AI-
  attribution rule (R3) on shipping docs and commit messages.
- The spec-change ripple (warns): editing a spec's `spec.md` without updating
  its `tasks.md` and `tests.md` cannot leave the work-breakdown or tests stale.
- The record-facts ripple (warns): completing a spec without touching the
  architecture docs its `plan.md` lists surfaces the gap (the git-aware
  complement to the static facts-to-record existence check).

**Team discipline (run as practice, not blocked by a gate):**

- The Analyze step: the read-only consistency pass before code (the
  checklist in Section 2), plus the cross-layer trace for cross-layer
  changes. A human reads spec, plan, and tasks together; no gate can replace
  that judgment.
- Facts-to-Record on landing: the gate confirms the listed docs exist; a
  person confirms the docs actually say what is now true.
- Reading running behavior to clear the done-gate (R6): only the owner driving
  the user-facing behavior by hand counts as `NextScrum-manual`.

**Available from the same data, turn on when needed:** the Blocked / Ready
flag (when a team or a dense backlog arrives) and full topological ordering
(only for formal cross-team scheduling). See Section 6. These derive from
the structured `depends-on` field with no rework.

---

## 11. One-screen cheat sheet

```
LOOP:   Rules -> Specify -> Plan -> Analyze -> Build -> Record Facts   (Continue wraps all)
IDS:    R1..RN (rules)   SPEC-NNN (specs)   plan/tasks are children   ADR-NNNN (decisions)
FILES:  ledger = requirements.md   big spec = specs/NNN-name/{spec,plan,tasks,tests}.md
TRUTH:  Architecture = docs/decisions/ (ADRs) + docs/architecture/ (design)
RECORD: when a feature lands, update the Architecture docs it listed. Not optional.
EARS:   WHEN <trigger> THE SYSTEM SHALL <response>   (one criterion = one test)
NEW REQ -> Playbook A    BUG -> Playbook B    REQ CHANGE -> Playbook C
```
