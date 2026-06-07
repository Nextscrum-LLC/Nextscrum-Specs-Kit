---
description: Clarify pass + test generation for a spec. Reads the EARS criteria, enumerates boundary/state/decision cases, asks the user only the open questions, then writes tagged unit + E2E tests and the tests.md coverage matrix.
argument-hint: SPEC-NNN
---
<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

Run the clarify pass for the spec named in the argument (for example
`/spec-tests SPEC-097`). Full method: `docs/TESTING-SYSTEM.md`. Budgets the
tests assert against: `docs/quality-budgets.md`.

## Scope check first

- **Folder spec** (`docs/specs/NNN-*/` exists): run the full pass below.
- **Inline spec** (ledger row only, single-file change): skip the matrix.
  Ask one question ("what boundary did this miss?"), write one failing test
  that reproduces it, then hand back for the fix. Do not run the full walk.

## The pass (folder specs)

1. **Read** `spec.md` (the EARS criteria), `plan.md` (contracts, the state
   machine, files to change), and `docs/quality-budgets.md`. Also read the
   real code the plan names, so you can cross-check the contract.

2. **Cross-check contracts.** Compare the criteria and the plan against the
   actual code and schema. Report any drift (a DB enum that disagrees with
   the API, a state the plan names that does not exist) BEFORE asking
   questions. A drift is a blocker; surface it as clarify question one.

3. **Derive silently.** For each criterion write the happy-path test in your
   head (the EARS sentence is the oracle). No questions needed for these.

4. **Enumerate silently** using ISTQB techniques:
   - input field -> equivalence partitioning (valid + invalid classes)
   - numeric/length range -> boundary value analysis (min-1, min, min+1, ...)
   - combined conditions -> decision table (one row per combination)
   - state machine -> state-transition (every legal hop + every illegal one)

5. **Clarify (the only interactive step).** Walk the applicable ISO/IEC
   25010 dimensions. The mandatory floor is functional + security +
   accessibility; performance, responsiveness, design-system, and
   reliability are opt-in when the spec actually has a budget or surface for
   them. Ask ONLY the questions the spec leaves open, batched (max 4 per
   `AskUserQuestion` call), each with your recommended option first and
   labelled. Do not ask about cases the spec already answers.

6. **Generate**, tagging every test `SPEC-NNN/C#/dimension/case`:
   - Unit tests (wide base) for logic, state machine, failure paths; reuse
     the project's shared test mocks where they exist.
   - E2E (thin top) only for cross-layer wiring; add rows to the project's
     E2E manifest where a verb already exists.
   - A test that targets unbuilt code is the executable spec: write it,
     mark its row `pending` in tests.md, and DO NOT add it to the runnable
     suite in a way that turns the test command red (testing rule). Land it
     with its phase.

7. **Record** `docs/specs/NNN-*/tests.md`: the criterion-by-dimension
   matrix (dash = audited skip, with the reason noted) and the tagged test
   list with per-case status (`ready` / `pending`). Feed any contract fixes
   the cross-check found back into `tasks.md`.

8. **Run** the unit-test command and invoke the `playwright-runner`
   agent. Report green / red and the coverage matrix.

> RESKIN: Replace "unit tests" and "E2E" with the project's actual test
> stacks and commands, and point the shared-mocks and E2E-manifest references
> at the real files. Keep the EARS-criteria + ISO/IEC 25010 dimension method
> intact; that is stack-neutral.

## Output

End with: the contract drift found (if any), the matrix, the count of
cases by criterion, and which are `ready` vs `pending`. Then remind that
the coverage gate (`scripts/rules/25-test-coverage.mjs`) will warn until
every criterion is referenced in `tests.md`.
