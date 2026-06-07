---
description: Analyze stage. Read-only consistency check across spec + plan + tasks before any code is written. Produces a report, changes nothing.
argument-hint: SPEC-NNN
---
<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

Run the read-only **Analyze** check for the spec named in the argument (for
example `/analyze SPEC-014`). This is the stage in `docs/SPEC-SYSTEM.md` that
catches contradictions on paper, where they cost minutes, instead of in code,
where they cost hours. It writes nothing; it reports.

## The checklist

Read `spec.md`, `plan.md`, and `tasks.md` together and answer each. Any "no"
is a fix to make before code.

1. Does every acceptance criterion have a matching contract in `plan.md` and a
   test in the test plan?
2. Does every task in `tasks.md` name the criterion it satisfies (no orphan
   tasks)?
3. Does the plan break any rule the spec lists under "Rules touched"? A rule
   conflict is a blocker, not something to explain away.
4. Are all relationships valid (depends-on / supersedes point at real specs;
   no dependency cycle)? `npm run audit:rules` checks this mechanically; eyeball
   it too.
5. Does `plan.md` list the Facts to Record (which architecture docs update on
   landing)?
6. Any ambiguity, duplication, or gap across the three files?

For a cross-layer spec, plan the cross-layer trace (the `chain-tracer` agent)
as the runtime counterpart to this paper check, to run after code.

## Output

A short report: each checklist item with pass/fail and the specific fix for
any fail. End with a clear go / no-go for starting the build.
