---
description: Plan stage. Turn a spec into a build plan (the how): approach, contracts, files to change, facts to record, and the criterion-to-test plan.
argument-hint: SPEC-NNN
---
<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

Write `plan.md` for the spec named in the argument (for example
`/plan SPEC-014`). This is the **Plan** stage in `docs/SPEC-SYSTEM.md`. The
plan is how to *build*; it is not a delivery plan (delivery is one global
pipeline, the same for every spec).

## Steps

1. **Read** the spec's `spec.md` and the real code it will touch, so the
   contracts match reality rather than assumption.

2. **Write `plan.md`** with:
   - **Approach:** the design in prose.
   - **Contracts:** interface shapes, data/schema changes, the state machine.
     Under-specified contracts are the classic source of multi-hour bug
     clusters; write them down.
   - **Files to change.**
   - **Facts to Record:** the architecture docs (ADRs in `docs/decisions/`,
     design docs in `docs/architecture/`) that must be updated when this
     lands. These are checked on landing, so list real paths.
   - **Test plan:** each EARS criterion (C1, C2, ...) mapped to a test.

3. **Stay buildable.** Every acceptance criterion in the spec must have a
   matching contract here. If a criterion has no contract, the spec or the
   plan is wrong; surface it now.

## Output

The plan path, a checklist confirming every criterion has a contract and a
planned test, and the Facts-to-Record list. Recommend running `/analyze`
next, before any code.
