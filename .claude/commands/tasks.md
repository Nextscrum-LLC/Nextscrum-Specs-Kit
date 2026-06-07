---
description: Tasks stage. Break a planned spec into ordered work units, each one naming the acceptance criterion it satisfies (no orphan tasks).
argument-hint: SPEC-NNN
---
<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

Write `tasks.md` for the spec named in the argument (for example
`/tasks SPEC-014`). This is the **Tasks** stage in `docs/SPEC-SYSTEM.md`: the
plan turned into the units of work.

## Steps

1. **Read** the spec's `spec.md` and `plan.md`.

2. **Write `tasks.md`** as `T1`, `T2`, `T3`, ... Each task names:
   - what it does,
   - the files it touches,
   - the acceptance criterion it satisfies (C1, C2, ...),
   - its status.

3. **No orphans.** Every task must map to at least one criterion, and every
   criterion must be covered by at least one task. A task with no criterion is
   scope creep; a criterion with no task is a gap. Fix either before coding.

4. **Order by dependency.** Sequence tasks so a task never depends on a later
   one. Note any task blocked by another spec.

## Output

The tasks path and a small table mapping each criterion to the task(s) that
deliver it, so the no-orphan rule is visible at a glance.
