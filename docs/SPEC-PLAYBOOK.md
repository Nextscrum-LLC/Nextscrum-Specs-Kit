<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# SPEC-PLAYBOOK.md: Driving the system from chat

> Companion to `docs/SPEC-SYSTEM.md` (the reference). This file is written
> from the product owner's seat. You drive everything by talking to the
> coding agent in chat; the agent does the git, the files, the tests, and
> reports back. You almost never type git or npm yourself.
>
> For each situation: **what you say**, **what happens**, **what the
> system enforces for you**, and **how you confirm**. Where spec-kit has
> `/spec` and `/plan`, your equivalent is plain chat plus a few signal
> phrases and slash commands listed below.

---

## 1. Your chat vocabulary (the "commands")

This is the whole control surface. You do not need to remember file paths
or rule numbers; these phrases are enough.

| You type in chat | What it does |
|---|---|
| Describe an ask in plain words ("I want X", "there's a bug where Y") | The agent records it as a numbered `SPEC-NNN` entry in the ledger |
| "go ahead" / "approved" / "do it" | The agent starts building the plan it just showed you |
| **"verified SPEC-NNN"** | Promotes that spec to `done` (the done-gate (R6) will not let it be `done` until you say this) |
| **"reject SPEC-NNN: <reason>"** | Keeps the spec at `in-review` with your reason noted |
| "what's the plan?" / "show me the plan first" | The agent writes spec + plan and shows you BEFORE coding (the Analyze step) |
| `/feature <name>` | Start a new feature branch with the right naming + initial commit |
| `/qa` | Run the full quality gate (format, lint, tests, smoke, dead-code, IP headers) |
| `/handoff` | Save state to HANDOFF.md + write a session log (do this before `/compact`) |
| `/walkthrough` | A teaching walk-through of what was just built |
| `/audit` | Security + performance + intellectual-property audit (before a release-shaped milestone) |
| `/explain <file>` | A pedagogical walk-through of a file or function |
| `/clean` | Auto-format, lint-fix, remove dead code |

That is it. Everything below is built from these.

> RESKIN: the slash commands map to your own `.claude/commands/`. Keep the
> phrase set small; the value is that you never have to remember paths.

---

## 2. The five gates that protect you (you do not run these; they run themselves)

On every commit, the machine checks the things humans forget. If a gate
fires, the commit stops and the agent fixes it before continuing. You will
usually never see these unless something is wrong.

| Gate | Catches |
|---|---|
| `audit:rules` | em dashes / banned words in shipping docs (R1-R2), version drift, dangling SPEC references (R7), depends-on cycles (R7), missing Facts-to-Record targets (R7) |
| the done-gate (R6) | a spec marked `done` before you said "verified SPEC-NNN" |
| the review-marker rule (R5) | a cross-layer change shipped without the required review pass |
| the version bump | code changed but the version was not bumped |
| the test suite | a change that breaks the tests |

---

## 3. Scenarios: say this, this happens

### Scenario A: You found a small bug

**You say:**
> "Bug: the export filename shows yesterday's date."

**What happens:** I log it as a small `SPEC-NNN` (inline in the ledger, no
folder; it is single-layer). I write a failing test that reproduces the
bug, fix the code until the test is green, and commit.

**Gates that fire:** `audit:rules` + the tests on commit. If the fix
touches a backend service, the cross-layer review marker (R5) is required
and I run that pass first.

**How you confirm:** I tell you exactly what to reload and look at ("export
again, the filename should read today's date"). When you have seen it, you
type **"verified SPEC-NNN"**. Until you do, the done-gate (R6) keeps it at
`in-review`.

---

### Scenario B: You want a new feature

**You say:**
> "I want saved report presets: a user saves a set of filters, it persists,
> and shows up in the preset list. Touches the UI, backend, and database."

**What happens:**
1. I record `SPEC-NNN` in the ledger.
2. Because it is cross-layer, I create a folder
   `docs/specs/NNN-saved-presets/` with `spec.md`, `plan.md`, `tasks.md`.
3. I write the acceptance criteria in EARS form ("WHEN you save a preset
   THE SYSTEM SHALL ..."), the contracts in `plan.md`, and list the
   Architecture docs to update under "Facts to Record".
4. I run the **Analyze** checklist (do the plan and tasks satisfy every
   criterion; does anything break a rule) and **show you the plan before
   writing any code.**

**You say:**
> "go ahead" (or "change the persistence layer first, then go ahead").

**What happens:** I build task by task. Each task is a commit. Cross-layer
commits run the cross-layer trace; a database migration runs the database
review; the version bumps. On the landing commit I **Record Facts** (update
the ADR / design doc the plan listed) so the truth docs never drift.

**How you confirm:** I hand you the EARS checklist to walk. You verify each,
then type **"verified SPEC-NNN"**.

---

### Scenario C: You change your mind (a requirement changes)

**You say:**
> "Actually, presets should be shareable across users, not private."

**What happens:** I do NOT silently edit history. I either update the spec
with the change noted or supersede the old spec with a new `SPEC-NNN` and
mark the old one `superseded`. I re-check which other specs depend on it,
update `plan.md` (especially Facts to Record, since the change usually
moves which Architecture docs must update), re-run Analyze, build, and
Record Facts.

**Gates that fire:** if I leave a dangling reference to the old spec, the
dependency-integrity check fails the commit. If I mark it done without
touching the design ADR, the ripple check reminds me.

**How you confirm:** "verified SPEC-NNN" once you see the new behavior.

---

### Scenario D: You make a decision with no code yet

**You say:**
> "Decision: we use Postgres full-text search, not a paid vendor."

**What happens:** I write or update an ADR (Architecture Decision Record)
in `docs/decisions/`. A decision with no code is a Record-Facts action by
itself. No build, no version bump.

**How you confirm:** nothing to verify in the product; you can read the ADR
and say "looks right" or ask for changes.

---

### Scenario E: You want a new standing rule ("from now on, always...")

**You say:**
> "From now on, every new endpoint must have a rate-limit test."

**What happens:** A standing "always do X" behavior is enforced by the
tooling, not by memory. So I either add a hook in `settings.json` (for
things the tooling runs automatically) or add the rule to `CLAUDE.md` and
pin a check in `scripts/audit-rules.mjs` so it cannot drift. A rule that is
not pinned in `audit:rules` is advisory and will eventually be forgotten,
so I always pin it.

**How you confirm:** I show you the new check failing on a bad example and
passing on a good one.

---

### Scenario F: You are stopping for the day (or about to /compact)

**You say:**
> "/handoff"

**What happens:** I update `HANDOFF.md` (current branch, version, what is
in flight, next pickup) and write a dated session log under
`docs/sessions/`. Next session, the agent reads those first and continues
without losing context.

---

### Scenario G: A gate blocks a commit (what you will actually see)

Sometimes I will tell you a commit was stopped. For example:

```
[FAIL] spec-refs: 1 dangling SPEC reference in the ledger: SPEC-204 (x1).
```

That means something references a spec that does not exist (often a typo or
a half-finished rename). **You do not fix this.** I read the message, fix
the reference or create the missing entry, and re-commit. The gate did its
job: it stopped a small mess from landing. The same is true for every gate
in the table above.

---

## 4. Pre-mortem: what can go wrong, and what catches it

The value of writing the system down before going back to code is this
list. Each likely mistake already has a guardrail.

| What goes wrong | What catches it | The fix |
|---|---|---|
| A rename or move misses a file | dependency-integrity check (dangling ref, R7), commit blocked | fix the leftover reference |
| A spec is marked done before you saw it | the done-gate (R6) | stays `in-review` until you type "verified SPEC-NNN" |
| A cross-layer change ships without the review pass | the review-marker rule (R5) | the pass runs, the marker is added |
| Code changes with no version bump | the version bump | version + HANDOFF bumped |
| A depends-on loop (A needs B needs A) | cycle detection (R7) | break the loop |
| A plan points at a doc that does not exist | Facts-to-Record target check (R7) | fix the path |
| A decision is made but the ADR never updated | Facts-to-Record (static) + ripple reminder (git-aware) | the ADR is listed in plan.md so the gate tracks it |
| An em dash or AI tell slips into a shipping doc | `audit:rules` (the voice rules (R1-R2) + the no-AI-attribution rule (R3)) | removed automatically before commit |
| Two specs claim the same number | numbers are immutable + assigned sequentially | the newer one is renumbered |
| An applied migration's SQL is edited | database-review marker forces review | write a new migration instead |
| A doc has no inbound link (becomes an orphan) | doc-orphans check | linked from its home |

The pattern: almost every failure is a forgotten step, and almost every
forgotten step now fails loudly at commit time instead of silently at
runtime.

---

## 5. Mechanical gates vs. team discipline

The system splits work into two layers by design (see `SPEC-SYSTEM.md`
Section 10). Some steps are mechanical gates that block the commit; others
are practices a person runs, because a gate cannot judge them. These three
sit on the discipline side on purpose:

- **Ripple-on-landing is a warning, not a block.** It reminds you to update
  the Architecture docs without stopping the commit (a hard block would
  false-fail when the docs were updated in an earlier commit). The check
  confirms the listed docs exist; a person confirms they say what is now
  true.
- **The folder-spec task check is a glance, not a gate.** A folder spec can
  carry an open task while the spec moves through review, so glance at the
  task list before you call the whole spec done.
- **The Analyze step is a practice, not a gate.** A gate cannot read spec,
  plan, and tasks together and judge whether they agree; a person does. I run
  it because skipping it is what an avoidable multi-hour bug cluster looks
  like.

---

## 6. If you ever want to do it by hand (reference)

You should not need these, but for completeness:

```
npm run audit:rules                              # run all rule checks
node scripts/check-ledger-done-gate.mjs          # ledger done-gate only
node scripts/rules/23-spec-refs.mjs --self-test  # dependency-integrity self-test
npm test                                          # unit tests
npm run test:e2e                                  # end-to-end (needs services up)
```
