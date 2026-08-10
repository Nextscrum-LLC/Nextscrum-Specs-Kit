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

## The orchestration default: one controller, lanes only when they pay

Two defaults follow from that shape, and both sit with trunk.

**Trunk is the controller and the only thing that talks to the human.** It
holds the conversation, takes the ask, decides how the work is shaped, and
reports back. Lanes build and commit; they do not merge, and they do not
message the human. A lane that stops to ask something is a lane that has
stopped, and a human answering five lanes separately ends up holding five
versions of the plan with no record of which lane heard what. Questions go into
the banked-questions section of the lane plan instead, where they are visible to
everyone and answered once, by trunk.

**Lanes are a choice, not the default shape of work.** Before writing a lane
plan, trunk decides whether the work is worth splitting at all. Parallelism has
a fixed price: a plan, a worktree and a self-contained brief per lane, a
verifier pass per lane, and a merge with full verification between each one. For
a one-line change, or anything that lives in a single file, that price is larger
than the work itself, and it manufactures a merge surface where there was none.
Sequential work in the main session has zero coordination cost, and zero is hard
to beat.

Split when the work genuinely divides: several pieces over disjoint files, or
one feature whose layers can be frozen at an interface. Answer "what does a
second lane buy here" out loud before spawning. If the honest answer is that it
finishes twenty minutes sooner, do it in one.

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

- **"Commit after each change, inside your worktree. Not at the end."**
- **"Do not merge, and do not spawn your own verifier."**

But do not rely on the first one. See the next section: a brief is an ask,
and asks get forgotten under a token limit. The guarantee has to come from
outside the agent.

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

**Sweep the worktrees from outside. Do not rely on the brief.**

Telling an agent to commit often is an instruction, and instructions are the
first thing to go when a context window fills. The durable version is a
script trunk runs, which does not care what the agent remembered:

```bash
# for every agent worktree: if it is dirty, commit it
for w in .worktrees/agent-*/; do
  git -C "$w" status --porcelain | grep -q . || continue
  git -C "$w" add -A
  git -C "$w" -c core.hooksPath=/dev/null commit -q -m     "chore(salvage): trunk swept this worktree. NO REVIEWER HAS SEEN THIS."
done
```

Run it **before spawning, between merges, and whenever a session looks like
it may end.** Wire it to a command name so it is one word, not a loop
somebody has to remember the shape of.

It is safe by construction: a worktree is one agent's private branch, so a
commit there cannot touch trunk, cannot touch another lane, and cannot reach
a remote. Bypass hooks deliberately, because the job is to PRESERVE work,
not to certify it, and a salvage commit that fails a lint gate defeats
itself. Say so in every message, so a salvage commit can never be mistaken
for a reviewed one. **Never merge salvaged work without running the
verifiers on it.**

The first time this ran on a real repo it found twelve uncommitted files in
two worktrees whose agents had died hours earlier.

**Then check the other half: work that IS committed and was never merged.**

Sweeping dirty worktrees is the obvious half, and on its own it leaves a
loophole big enough to lose a feature through. An agent that did exactly what
its brief asked, committed each change, and then died leaves a clean
worktree. A sweep that only looks for uncommitted files calls that worktree
clean and walks straight past finished work. Worse, a worktree directory can
be removed while its branch survives, so the work is invisible to anything
that walks directories at all.

So the sweep also lists every agent branch holding commits the current HEAD
does not, flagging the ones whose directory is gone:

```bash
for b in $(git for-each-ref --format='%(refname:short)' 'refs/heads/agent-*'); do
  n=$(git rev-list --count "HEAD..$b")
  [ "$n" = 0 ] || echo "$b: $n unmerged commit(s)"
done
```

It lists and does not merge. A salvaged branch has not been through a
verifier, and merging it quietly is the exact thing this protocol exists to
prevent.

**Keep an adjudication file, or the warning stops working.** A warning that
never shrinks is a warning nobody reads. The second time you see the same two
branches you skim; the third time you stop looking, and the fourth time
carries something new. Record one line per decided branch in a **tracked**
file (`docs/worktree-adjudications.md`) with the verdict and the reasoning,
and have the sweep move those into a separate "already decided" section.
Everything left under UNMERGED WORK is then genuinely news.

Tracked matters. The first draft of that file lived beside the worktrees, in
an ignored directory, so the decisions would have vanished on a fresh clone
and the next session would have re-investigated the same branches from
scratch.

Write the verdict with its evidence, not just a label. "Superseded" is
useless six weeks later; "superseded, this holds the file at 939 lines
against trunk's 1259 from the same team's second worktree, which three
reviewers cleared" can be checked by someone who was not there.

**Check both halves at the START of every session, before new work.** This is
the point where a previous session's loss is still recoverable and the point
where you are least likely to think of it. Put it in the session protocol
above the handoff read, so it happens whether or not anyone remembers the
last session ended badly.

**Then make that step mechanical, because a protocol step is still prose.**
A session-start instruction is the same kind of thing as "remember to run the
reviewer", and the same thing happens to it. Add a warn-only rung to whatever
already runs on every commit: list agent branches ahead of HEAD, subtract the
adjudicated ones, warn on the rest. It fires whether or not anybody remembered
the session-start step, and it costs nothing when the list is empty.

Warn, do not fail. An unmerged branch from last week is not a defect in the
commit being made, and blocking unrelated work on it just teaches people to
route around the checker.

One caveat worth knowing: a worktree whose agent process is still holding it
cannot be removed, and force-removing a locked worktree to tidy a report is
not a trade worth making. Record it in the adjudication file and move on.

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

> Run a parallel session. First sweep what earlier sessions left: commit any
> dirty agent worktree, and list any agent branch holding unmerged commits,
> including ones whose directory is gone. Then write the lane plan to `sessions/<run>-plan.md`
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
- [ ] Each brief self-contained and says commit-per-change and do-not-merge
- [ ] The worktree sweep is wired to a command, and you ran it
- [ ] Previous sessions checked: dirty worktrees swept AND unmerged branches
      listed, each one either adjudicated or still open in front of you
- [ ] That check is wired into the per-commit rule runner, not only into the
      session protocol prose

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
- [Design debate](/docs/DESIGN-DEBATE.md) for settling a hard-to-reverse design
  before any of this starts
