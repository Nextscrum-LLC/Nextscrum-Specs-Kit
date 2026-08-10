<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# Writing less code

> Two disciplines that work together. A change says exactly one thing, so every
> line in the diff traces back to the ask. And before any of those lines get
> written, you walk a ladder that asks whether they need to exist at all.
>
> Every rule below exists because the opposite cost real time somewhere. The
> failure each one prevents is named, because a rule with its reason attached
> survives contact with a tired reader and a bare rule does not.

## The test

**Every changed line traces to the ask.** That is the whole rule; the rest of
this page is what it rules out.

A diff that does one thing can be reviewed in the time it takes to read it. A
diff that does one thing plus four improvements cannot, because the reviewer now
has to work out which lines are the change and which are taste. The improvements
are usually fine. The problem is that they are indistinguishable from the part
that could break production, and the reviewer's attention is the scarce resource
being spent.

## Do not improve adjacent code

Not the formatting, not the comments, not the naming, not a nearby function that
offends you. Match the existing style even where you would do it differently.

Consistency inside a file is worth more than any single line being better,
because the next reader learns the file's conventions once and then trusts them.
A file written in two styles teaches nothing and has to be read twice.

## Mention dead code, do not delete it

You will notice pre-existing dead code while working. Say so in the report or
the session log. Leave it.

Deleting it buries the actual change in a diff nobody can review, and "it was
dead" becomes a claim the reviewer has to verify on your behalf. That
verification is the expensive part: proving nothing calls a function means
searching the whole codebase, including dynamic call sites a grep will not find.
You are handing someone else an hour of work so your commit can be tidier.

## Clean up only your own orphans

Imports, variables and helpers that **your** change made unused are yours to
remove, because you created them and the diff already explains why they went.
Everything else is not yours. The line is ownership, not neatness: if the orphan
did not exist before your edit, it is part of your change.

## Noticing a real defect is not the failure; burying it is

None of the above says leave defects alone. A locked rule being violated in a
file you happened to open is worth fixing, and spotting it is a good thing. The
failure is only ever the delivery.

1. **Fix it in its own commit**, so each diff still traces to one ask. A two-line
   commit that repairs a rule violation costs nothing and reviews instantly.
2. **Better: make it mechanical, so nobody has to notice it by eye.** Violations
   of this kind usually survive because the rule's checker does not cover the
   file they live in. A rule whose checker cannot see a path cannot fire there,
   and "somebody will spot it" is not enforcement. In one codebase, widening a
   voice checker to cover the root state documents immediately surfaced nineteen
   more violations that nobody had seen in months of reading those files.
3. **If it is out of scope to fix now, say so** rather than silently fixing it or
   silently ignoring it. Both silences look identical from outside, and only one
   of them is recoverable.

## The override

An explicit cleanup, audit or production-readiness mandate suspends the "do not
touch adjacent code" half of this page. That request **is** "go find and remove
what should not be here", and refusing to remove things under it would be the
error.

Say which mandate you are acting under, in the commit message or the report. A
sweeping diff with its mandate named is reviewable; the same diff arriving
unannounced is the exact thing the rule exists to prevent. Absent such a mandate,
the default is to leave it alone and mention it.

## The ladder, walked before writing anything

The usual version of this advice is reactive: extract a helper when you notice a
duplicate. That only fires once the duplicate exists, which is after the cost has
already been paid. This is the proactive half, walked before the first line:

1. **Does this need to exist at all?** If no, skip it.
2. **Is it already in this codebase?** Reuse it. Do not rewrite it.
3. **Does the standard library do it?** Use it.
4. **Does the platform do it natively?** Use it.
5. **Does an already-installed dependency do it?** Use it.
6. **Can it be one line?** Make it one line.
7. **Only then** write the minimum that works.

The rungs are in that order because each one is cheaper to maintain than the one
below it. Code that does not exist has no bugs, code you did not write has
someone else maintaining it, and code that already exists in your repo has
already been reviewed and tested once.

## Read before you pick a rung

Lazy about the solution, never about reading. You cannot know something already
exists without looking, and step 2 is where nearly all the value sits.

Skipping the read is what produces the fifth implementation of the same idea. In
one codebase, an audit found an identifier-validation helper exported from a
shared utilities file and imported by eight modules, while two other modules
declared the same pattern inline. Neither author had done anything unreasonable;
neither had looked. The search would have taken under a minute.

The read is also what makes rung 2 honest. "I could not find one" and "I did not
search" produce the same code and are completely different claims, so say which
one it was.

## What minimalism never cuts

Trust-boundary validation. Data-loss handling. Security. Accessibility.

"Less code" is never a reason to drop a check on untrusted input or an aria
label. These are not lines competing with other lines; they are the properties
that make the feature correct rather than merely present. Boundary-case handling
(R11) and the security baseline outrank everything on this page, and where they
conflict with brevity, brevity loses.

A version that is shorter because a validation is missing is not a smaller
solution to the same problem. It is a solution to an easier problem nobody asked
for.

## Drift is the cost, not the line count

A duplicate is not expensive because of the extra lines. It is expensive because
the copies diverge silently, and nothing tells you when they do.

The generic shape, seen often enough to be worth writing down: a normalisation
rule (strip a leading marker character off an identifier before looking it up)
implemented in a dozen places across a codebase. Exactly one of those copies also
trimmed surrounding whitespace. So an identifier arriving with a trailing space
matched cleanly in one code path and returned 404 from another, in the same
request flow, for the same input. Nothing was broken when any of those copies was
written. They drifted, one small fix at a time, and no test failed at the moment
the fix landed in one place and not the other eleven.

That is the failure mode to fear: not the extra lines, the silent disagreement.
It also tells you which duplicates matter. Two similar-looking blocks that encode
the same **rule** will drift and hurt. Two blocks that merely look alike today
and answer to different requirements should stay apart, because merging them
couples two things that are free to change independently.

## The opposite failure, stated as an equal

Do not build for reuse before reuse exists.

- An abstraction with one caller.
- A configuration option nobody sets.
- A "flexible" helper used in exactly one way.

Each of these costs a reader an indirection, costs a maintainer a contract to
preserve, and is almost always wrong about what the second caller will actually
need. The generalisation is guessed from a single example, so when a real second
case appears it usually does not fit, and now you rework an abstraction instead
of writing a function.

Both failures are the same mistake about **when** to generalise: the duplicate
generalises too late, after the copies have drifted; the speculative abstraction
generalises too early, from one example. Neither is a matter of taste, and
neither is fixed by preferring more or fewer lines in general.

## Nothing speculative

No abstraction for single-use code. No configurability nobody asked for. No error
handling for genuinely impossible cases. If 200 lines could be 50, write the 50.

The impossible-case clause is the one that gets misread, so it pairs explicitly
with boundary-case-first coding (R11): handle what can happen, and be able to say
why the rest cannot. A branch guarding against a state the type system or the
call site already rules out is not caution. It is a claim that the state is
reachable, which the next reader will believe and then design around.

## Copy-paste kickoff

> Before you write this, walk the ladder out loud. Does it need to exist at all;
> is it already in this codebase (search, do not guess); does the standard library
> or the platform or an installed dependency already do it; can it be one line.
> Only then write the minimum that works, and tell me which rung you landed on and
> what you searched. While making the change, every changed line must trace to the
> ask: do not reformat, rename, re-comment or improve any adjacent code, and match
> the existing style even where you would do it differently. If you notice
> pre-existing dead code or a rule violation, mention it and leave it, or fix it in
> its own separate commit; do not fold it into this diff. Remove only the imports
> and helpers your own change orphaned. Do not add an abstraction with one caller,
> a config option nobody set, or error handling for a case that cannot happen. Never
> shorten by dropping input validation, data-loss handling, security or
> accessibility.

## Checklist

Before writing:

- [ ] Rung 1 answered: does this need to exist at all
- [ ] Rung 2 answered by **searching** the codebase, not from memory
- [ ] Standard library, platform and installed dependencies checked
- [ ] The rung you landed on is stated, along with what you searched

In the diff:

- [ ] Every changed line traces to the ask
- [ ] No adjacent formatting, naming, comment or style improvements
- [ ] Pre-existing dead code mentioned, not deleted
- [ ] Only your own orphaned imports and helpers removed
- [ ] Any rule violation you spotted is in its own commit, or reported as out of
      scope, and never silently either way
- [ ] If the "leave it alone" half is suspended, the mandate is named

In the code:

- [ ] No abstraction with a single caller, no unused config option
- [ ] No error handling for genuinely impossible cases (and you can say why they
      are impossible)
- [ ] Validation, data-loss handling, security and accessibility intact; nothing
      on this list was cut for brevity
- [ ] Any duplicate of an existing **rule** collapsed, or its drift risk named

## Related

- [Design debate](/docs/DESIGN-DEBATE.md) for the decisions big enough that the
  cheapest option deserves an argument before anything gets written
- [Rules and checks](/docs/rules/README.md) for R11 (boundary-case-first coding),
  and for widening a checker so a violation cannot depend on somebody noticing it
- [Parallel agents](/docs/PARALLEL-AGENTS.md) for keeping the same discipline
  when several agents are writing at once, each inside its own file ownership
- [Spec system](/docs/SPEC-SYSTEM.md) for where "the ask" is written down in the
  first place, which is what a changed line traces back to
