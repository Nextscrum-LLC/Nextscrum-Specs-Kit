---
description: Regress - reproduce a reported bug, write the failing test first (proving it), then fix until green. The failure-to-permanent-test loop (R15 / Playbook B).
---
<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

Turn a failure into a permanent test, then fix it. The point is order: the test
comes first and must fail, so you have proof it captures the bug and proof the
fix works. This is how the suite accretes a regression case from every failure
(R15), not just when someone remembers to.

## Steps

1. **Reproduce.** Get the exact inputs and the observed wrong behavior. Capture
   the error and, if there are logs, the correlation id and code anchor (R13) so
   you land on the right code path. If you cannot reproduce it, stop and say so;
   do not guess a fix.

2. **Write the bug as an EARS guard.** State the correct behavior as one
   criterion: `IF <the bad case> THEN THE SYSTEM SHALL <the correct behavior>`.
   For a folder spec, add it to `spec.md` with the next immutable `C#`; for a
   small bug, an inline ledger row is enough (see `SPEC-SYSTEM.md` Playbook B).

3. **Write the failing test first, and run it.** Tag it to the criterion
   (`SPEC-NNN/C#/<dimension>/regression`). Run only that test and **confirm it
   fails** for the right reason. A test that passes before the fix proves
   nothing; rewrite it until it fails because of the bug.

4. **Fix on a `fix/` branch** until the new test passes and the rest stay green.
   Handle the boundary the bug exposed in the same pass (R11), not just the one
   reported input.

5. **Run the suite + the right review.** `npm test` (or the project's runner)
   plus the end-to-end suite; run the cross-layer trace if the fix spans layers,
   the database review if it touches schema.

6. **Commit as `fix:`** so R15 sees the regression test in the same commit. If
   the fix genuinely has no testable surface (a comment typo), add
   `[no-regression-test: <reason>]` to the message so the skip is auditable.

7. **Record facts** only if the fix changed a documented decision or design;
   most bug fixes do not. Verify and close (the done-gate, R6).

## What NOT to do

- Do not fix first and add the test after; you lose the proof the test catches it.
- Do not weaken or delete an existing test to make the suite green (the
  `test-no-shrink` guard will flag a shrinking suite).
- Do not close the bug until the failing-then-passing test is committed.
