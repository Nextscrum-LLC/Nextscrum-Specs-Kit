<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# SPEC-000: Export a report as CSV

> Worked example of the spec format. The ledger row
> (`docs/requirements.md` SPEC-000) is the index; this folder is the
> detail. See `docs/SPEC-SYSTEM.md` for the method. This is a teaching
> artifact; delete the folder once you have real specs.

- **Status:** open (plan approved; build not started)
- **Owner:** NextScrum
- **Date:** 2026-06-07
- **Verified by:** pending (NextScrum-manual once an export is downloaded and opened)

## Why

The report is view-only today, so users re-key its numbers into a
spreadsheet by hand. A one-click CSV export removes that manual step. It is
also deliberately small and well-bounded, which makes it the right first
feature to show the spec system end to end: a handful of EARS criteria that
each map cleanly to a contract, a task, and a test.

## Acceptance criteria (EARS)

1. WHEN the user clicks "Export as CSV" on a report THE SYSTEM SHALL stream
   a UTF-8 CSV download whose filename contains the report id and today's
   date.
2. IF the report id or filename param contains a path-traversal sequence
   (`..`, a leading `/`, or a drive prefix) THEN THE SYSTEM SHALL reject the
   request before any file or query work.
3. IF the report has zero rows THEN THE SYSTEM SHALL return a CSV containing
   only the header row (not an error and not an empty body).
4. THE SYSTEM SHALL escape any cell value beginning with `=`, `+`, `-`, or
   `@` so a spreadsheet does not interpret it as a formula.
5. WHILE an export is in progress THE SYSTEM SHALL disable the Export
   button and expose a busy state to assistive technology.

## Rules touched

- **The voice rules (R1-R2):** the button label and any toast copy follow
  the no-em-dash (R1) and banned-word (R2) rules.
- **Acceptance criteria are tested (R8):** each criterion ships with a test
  that proves it.
- **The done-gate (R6):** closes only at NextScrum-manual with the UAT
  checklist walked.

> RESKIN: the R-numbers map to R1-R12 in this kit's `CLAUDE.md`; point
> "Rules touched" at your own rule numbers.

## Relationships

- **Parent:** none.
- **Children (tasks):** T1..T4 (see `tasks.md`).
- **Depends-on:** none.
- **Blocks:** none.
- **Supersedes:** none.
