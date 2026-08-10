<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# Debating a design before you build it

> Generate more than one option, argue them against each other, decide, and
> record why. Only for the decisions that are expensive to undo. For everything
> else, build it.
>
> Every rule below exists because the opposite cost real time somewhere. The
> failure each one prevents is named, because a rule with its reason attached
> survives contact with a tired reader and a bare rule does not.

## The rule

Before building anything that is hard to reverse, produce at least two real
options, argue them against each other from different angles, pick one, and
write the reasoning into a decision record (an ADR under `docs/decisions/`).

The record names the options, the one chosen, and what the others would have
bought. A log that lists only the winner is a receipt, not a record. Nobody can
re-open it later, because the alternatives it beat are gone.

The failure this prevents is quiet and common: the first workable idea,
implemented well. That is a fine outcome most of the time. It gets expensive
exactly when the decision is hard to undo, which is what the trigger is for.

## When it fires

**A rule that fires on everything fires on nothing.** Debating every
implementation choice costs more than it returns, and expensive rituals get
skipped or faked under deadline pressure, which is worse than not having the
rule at all.

So the debate is required only when the decision is hard to reverse. Run it if
ANY of these is true:

- [ ] Undoing it after it ships would take more than about a day.
- [ ] It locks a data shape: a migration, a wire contract, a stored format,
      anything already written somewhere you cannot rewrite unilaterally.
- [ ] It crosses a module boundary, or adds a dependency.
- [ ] It touches money, credentials, security posture, or a third party's terms.

**Anything else: just build it.** Saying that out loud is part of the rule. "I
checked whether this needed a debate and it does not" is a different state from
"it never occurred to me", and only the first one is reviewable.

The bar is not invented here. It is the ordinary test for architectural
significance: expensive to reverse, crosses team boundaries, constrains later
decisions. Easy to reverse and narrow belongs in a pull request, not in a
durable record.

## Durable, not newest

Newer means fewer people know it, less prior art when it breaks, more churn in
the interface you are about to depend on, and more attack surface. Choosing for
the moment of adoption is choosing the cheapest moment in a dependency's life.
The bill arrives later, when the package is unmaintained, several majors
behind, and carrying an advisory nobody upstream intends to fix. Every one of
those started as somebody's reasonable choice of the newest thing.

Aim at what will still be right in two years. That is usually the boring,
well-understood option, and boring is a technical property here, not an
aesthetic one: it means the failure modes are already documented by other
people.

Where a newer approach genuinely wins, take it, and write down what its
immaturity costs: who else runs it in production, what happens if the
maintainer stops, and what the exit looks like. A newer choice with its price
named is a decision. A newer choice defended as modern is a preference wearing
a decision's clothes.

## Name what loses

Best experience AND best performance AND best security is a wish, not a
decision. Those qualities trade against each other constantly: a security
control costs a click, a cache costs freshness, an abstraction costs a stack
frame, an audit trail costs write throughput.

So a record must name the quality it traded away, and why that trade is right
for this problem. "We accepted a slower first render to keep the token off the
client" is something a reader can argue with in a year. "Fast, safe and
pleasant" is not, and a record that cannot be argued with has recorded nothing.

If the debate ends with nothing sacrificed, it was not a debate. The options
were not different enough to be options.

## Diverse seats, not titles

Two architects who agree add nothing. Titles do not make a panel; different
failure modes do. Each seat hunts a **different** failure. Minimum three:

- **The boring seat.** What is the dumbest thing that could work, and why is
  that not enough? If nobody can answer, build the dumb thing. This seat pays
  for itself the first time it kills a queue that a table column would have
  handled.
- **The abuse seat.** How does this fail with hostile input, a hostile user, or
  a third party changing its mind? Nothing outside your process is a promise. It
  is a service that can rate-limit you, deprecate the field, or rewrite its
  terms on a Tuesday.
- **The maintainer seat.** Who pays for this in a year, and what must they
  understand before they can safely change it? Cleverness is a loan taken
  against somebody else's afternoon.

Add a seat for each further axis that could sink the thing: cost, latency,
migration risk, compliance, operability. One seat per axis, not one seat per
person who happens to be available.

The seats can be three prompts to one model, three separate sessions, or three
people around a table. What matters is that each starts from a different
objective, and that disagreement gets written down instead of smoothed over.

## Two rounds, then decide

Round 1: each seat states its case and its strongest objection to the others.
Round 2: the surviving options answer those objections. Then decide.

**Open-ended debate is a failure mode, not thoroughness.** Past two rounds an
argument stops producing new information and starts producing restatements, and
a decision deferred is a decision made by whoever ships first.

Record the dissent. If a seat still objects when the decision lands, put its
objection in the record along with what evidence would change the answer. That
sentence is what makes the record re-openable when the objection turns out to
have been right, and it turns the loser of an argument into the earliest
warning system you have.

## What the record carries

- The options considered, including the boring one, in enough detail that a
  reader can tell they were real.
- The choice, and what each rejected option would have bought.
- The quality traded away, and why that trade fits this problem.
- Any unresolved dissent, and what evidence would reverse the decision.
- A **re-verify by** date.

The re-verify date is the part people skip. "The best current approach" is a
point-in-time claim, exactly like a confirmed platform limitation, and it goes
stale the same way: the library gets a maintainer, the API adds the endpoint,
the constraint that forced the shape disappears, and the record becomes wrong
while still being cited as settled. Six months is a sane default for a
technology choice and twelve for a structural one. On that date, re-read the
sources and either bump the date or re-open the decision.

Two things keep the record honest. Ground every external claim before it enters
the record (current docs plus prior art, cited, per R9) rather than asserting
third-party behavior from memory. And keep the record in the ADR format you
already have: a separate "debate log" format drifts from the ADRs within a
quarter, and then you have two places to look and no idea which is current.

This is a convention, not a script rule. No checker can see whether a change was
hard to reverse, so the trigger is judgement, self-attested, and caught in
review. The reviewable question is short: **where is the record for this?**

## Copy-paste kickoff

> Before building this, check the trigger: would undoing it after ship take more
> than about a day, does it lock a data shape (migration, wire contract, stored
> format), does it cross a module boundary or add a dependency, does it touch
> money, credentials, security posture, or a third party's terms? If none of
> those, say so and just build it. If any of them, run the debate. Give me at
> least two real options, one of which is the dumbest thing that could work.
> Argue them from three seats hunting different failures: the boring seat, the
> abuse seat (hostile input, hostile user, third party changing its mind), the
> maintainer seat (who pays for this in a year). Add a seat for cost, latency or
> migration risk if they apply. Ground every claim about an external system in
> its current docs plus prior art, and cite them; do not describe an API from
> memory. Aim at what will still be right in two years rather than what is
> newest, and if you pick the newer thing, say what its immaturity costs.
> Maximum two rounds. Then decide and write an ADR naming the options, what each
> rejected one would have bought, the quality you traded away and why that is
> right here, any dissent that survived and what would reverse it, and a
> re-verify by date.

## Checklist

Before building something hard to reverse:

- [ ] Trigger checked, and the answer written down either way
- [ ] At least two real options, one of them the boring one
- [ ] Minimum three seats, each hunting a different failure
- [ ] Extra seats added for cost, latency, migration risk where they apply
- [ ] External claims grounded in current sources, not memory (R9)
- [ ] Two rounds maximum, then a decision

In the record:

- [ ] Options listed, with what each rejected one would have bought
- [ ] The quality traded away, named, with the reason it is right here
- [ ] Surviving dissent recorded, with what evidence would reverse it
- [ ] A re-verify by date
- [ ] Linked from the decisions index, and from `CLAUDE.md` if it locks
      something

## Related

- [Decisions (ADRs)](/docs/decisions/README.md) for the record format this
  writes into, and the numbering and supersession conventions
- [Platform limitations](/docs/platform-limitations/README.md) for the
  re-verify discipline this borrows, and for where a confirmed upstream limit
  gets recorded once instead of re-derived
- [Rules and checks](/docs/rules/README.md) for R9 (grounding external claims)
  and for locking this as a numbered rule in your fork if you want it named
- [Parallel agents](/docs/PARALLEL-AGENTS.md) for running the build once the
  design is decided
