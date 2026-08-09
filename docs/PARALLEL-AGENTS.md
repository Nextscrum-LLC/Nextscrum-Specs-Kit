<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# Running work in parallel with agents

> How to put several agents on a codebase at once without them colliding,
> without shipping unreviewed work, and without losing a day when one of them
> dies partway through.
>
> Every rule below exists because the opposite cost real time. The failure
> that produced each one is named, because a rule with its reason attached
> survives contact with a tired reader and a bare rule does not.

## The shape

Three roles, and keeping them separate is most of the value.

- **Trunk** is you (or the main session). It plans, spawns, verifies, merges,
  and owns anything shared. It never writes feature code inside a lane.
- **A lane** is one agent in its own worktree with an exclusive set of files.
  It builds and commits. It does not merge and it does not verify itself.
- **A verifier** is a separate agent, spawned by trunk, that reads the spec
  and the code and judges whether one matches the other.

The single most common mistake is collapsing the last two. An agent that
grades its own work grades its intentions.

## Before you split: write the lane plan

Write `sessions/<run>-plan.md` before spawning anything, and link it from the
session log. Splitting first and documenting after produces a plan that
describes what happened rather than one that prevents anything.

The plan carries six things:

1. **The lanes.** One line each: what it is, which spec, what it owns.
2. **Exclusive ownership.** Every file belongs to exactly one lane.
3. **Shared files, one owner each.** Some files everyone wants (an API
   client, a copy file, a route index). Name one owner. Everyone else gets an
   **append-only escape hatch**: add a clearly fenced block at the end of the
   file and flag it in the report, so the owner resolves it at merge instead
   of two lanes editing the same lines.
4. **Reserved resource numbers.** Migrations, ports, feature flags, anything
   with a monotonic counter. Two lanes both writing `047-*.sql` is an
   unrecoverable merge. Assign the numbers up front or keep migrations on
   trunk.
5. **Frozen interfaces where lanes touch.** Where two lanes meet, write down
   the contract before either builds against it.
6. **A banked-questions section.** Lanes write questions here instead of
   stopping. Nobody blocks on an answer.

## The lane brief

Each brief is self-contained. Sub-agents cannot see your chat, so anything
you know and do not write down does not exist.

A brief contains: the goal in one paragraph, the spec folder, the rules it
must follow, **exactly what it may write**, what it must not touch and who
owns those instead, the boundary cases you already know about, and the done
criteria.

Two things belong in every brief:

- **"Commit after each completed task, inside your worktree. Not at the
  end."** This is the highest-value sentence in the whole document. See
  "Surviving an interruption" below.
- **"Do not merge, and do not spawn your own verifier."**

Where a lane has a real judgement call in it, say so and tell it to report
rather than guess. A lane told "if the honest answer is that we cannot tell,
say that" will say it. A lane not told will ship a confident number.

## Verification

**Trunk spawns the verifier, not the builder.** A verifier spawned by the
builder is a child process of the builder: when the builder hits a limit or
crashes, the verifier dies with it, and the work arrives finished and
completely unreviewed. This happened; the code looked done and nothing had
looked at it.

**The verifier gets the spec and the code. It does not get the builder's
report.** A report frames the reviewer's attention around what the builder
already thought about. The interesting defects are elsewhere.

**Ask the verifier for specific attacks, not a general review.** "Judge these
five things, hardest first, BLOCK or WARN or OK each with file and line" gets
useful answers. "Review this" gets a summary of the diff.

Worth putting in most verifier briefs:

- **The anti-vacuous check.** "Pick the two most important new assertions and
  say whether they would actually fail if the behavior regressed." Tests that
  pass because a selector matched nothing are worse than no tests, because
  they also buy false confidence.
- **Run the suites yourself rather than trusting they were run.**
- **"If the lane got something right that a reviewer would normally miss, say
  so briefly."** You want to know where the real risk is, not a flat list.

## Verify findings before acting on them

A verifier's report is evidence, not a verdict. Check the load-bearing claims
yourself, especially security findings and especially before you write them
into a permanent record.

A lane once reported that untrusted input reached a model prompt without
delimiters and asked for a one-line fix. The wrapping was already there, two
lines from where the lane had been reading. Had that gone into the spec
folder uncorrected it would have become a permanent false note, which is
exactly how a hand-maintained requirements ledger drifts into contradicting
itself.

Record the refutation somewhere durable. A finding that was investigated and
disproved is worth as much as one that was confirmed.

## Loops

**Maximum three rounds.** Round 1 builds. Round 2 fixes what the verifier
blocked. Round 3 is the last chance. Still failing after that, the lane is
**marked stuck in its own spec folder, its work is committed anyway, and the
run moves on.** Never open-ended.

Marking a lane stuck does not mean discarding it. Commit whatever exists,
note plainly that no reviewer has cleared it, and let the next session decide.

## Merging

**One lane at a time, by ascending blast radius.** Docs first, then
single-surface changes, then shared services, then anything with a migration.

This is not the same as reverse order. Reverse order puts the riskiest change
in first and every later merge inherits its breakage.

**Full verification between merges, not batched at the end.** Unit,
integration, whatever rule checker you have, and end-to-end on any merge that
touched a user surface. A batch merge at the end tells you something broke
and nothing about which lane broke it.

**Apply migrations at merge, to every environment or none.** A migration
applied to one database and not another is the worst state to be interrupted
in, which is why it belongs in the resume file until it is resolved.

## Surviving an interruption

Sessions end without warning: rate limits, crashes, closed laptops. Design
for it rather than hoping.

**Keep a `RESUME.md` at the repo root**, read before anything else. It
answers one question: what happens next, and is anything stranded. It carries
the next action, every in-flight lane with its worktree path and whether it
has committed, anything half-applied, and a copy-paste command that lists
uncommitted work across every agent worktree.

Update it when state changes, not at the end of a session. The case it exists
for is a session that never reaches its end.

It is not a handoff document. A handoff is the narrative of what happened;
this is the pointer to what is next. Keep both.

**On resume: run the stranded-work check before starting anything new.**

```bash
for w in .worktrees/agent-*/; do
  echo "== $w"; git -C "$w" status --short | head
done
```

Anything listed is uncommitted work from an agent that died. Commit it inside
its own worktree with a message saying plainly that no reviewer has seen it.
Then decide whether to keep it. Never merge salvaged work without running the
verifiers on it.

## The failure mode worth naming separately

**A rule that cannot fire looks exactly like a rule with nothing to report.**

Three instances of this shape turned up in two days in one codebase:

- A checker that only inspected artifacts that already existed, so producing
  no artifact at all skipped it entirely.
- A rule that warned instead of failing, so it was ignored twice.
- A rule keyed on a directory path that a refactor had deleted months
  earlier, so every commit it should have caught passed silently.

All three reported green the entire time.

When you fix one, **fix the class**: anchor the rule to something that cannot
silently move (a manifest, a lock file, a generated list), and write a test
that asserts the rule can still fire. Then prove that test by mutation:
reintroduce the broken state and confirm the test fails. A test for a checker
that has never been seen to fail is not yet evidence of anything.

## Where status lives

**Lanes write status into their own spec folder. The central ledger is
regenerated from those, not hand-edited by lanes.**

A ledger that many writers edit by hand drifts. In one audit, twenty entries
contradicted themselves or each other, and the index counts were wrong by
twenty-six against the real entry count. Regenerating from per-spec folders
makes the folder the source of truth and the ledger a view.

**Accumulate acceptance steps into one file per run**, appended by each lane
under its own heading, never edited across lanes. The person doing acceptance
walks one page instead of opening every spec folder.

## Copy-paste kickoff

> Run a parallel session. Write the lane plan to `sessions/<run>-plan.md`
> first: lanes, the folder each owns, shared files with one owner each,
> reserved migration numbers, and where lanes touch. Freeze those interfaces.
> One writer per worktree, self-contained briefs, commit each task as you
> finish it. Trunk spawns the verifier separately with the spec and the code,
> never the builder's report. Max 3 rounds, then mark stuck and salvage.
> Merge one lane at a time by ascending blast radius, with integration and
> full verification after each. Lanes write status and acceptance steps into
> their own spec folder; regenerate the ledger from those at the end. Do not
> ask me anything: bank the questions in the plan doc.

## Checklist

Before spawning:

- [ ] Lane plan written and linked, not planned in your head
- [ ] Every file has exactly one owner
- [ ] Shared files named, with an append-only escape hatch
- [ ] Resource numbers reserved
- [ ] Each brief self-contained and says commit-per-task and do-not-merge

While running:

- [ ] Verifiers spawned by trunk, given the spec and code only
- [ ] Findings verified before being written down as fact
- [ ] Questions banked, nothing blocked on an answer
- [ ] `RESUME.md` updated as state changes

Before merging each lane:

- [ ] Verifier clear, or its findings explicitly accepted with a reason
- [ ] Full verification passing
- [ ] Migrations applied everywhere or nowhere
- [ ] Acceptance steps appended to the run's checklist

## Related

- [Spec system](/docs/SPEC-SYSTEM.md) for what a spec folder contains
- [Testing system](/docs/TESTING-SYSTEM.md) for the dimensions a verifier
  should expect tests to cover
- [Rules and checks](/docs/rules/README.md) for making a rule enforceable
  rather than advisory
