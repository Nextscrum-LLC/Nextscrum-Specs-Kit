<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# Requirements ledger

Living source of truth for every ask the product owner has made. Numbers
are immutable; status changes freely. Maintained by the requirements-ledger
agent (or by hand, carefully).

## Index

- Open: 0
- In progress: 0
- In review: 0
- Done: 0
- Punted: 0
- Blocked: 0
- Superseded: 0

(The single example entry below is a teaching artifact and does not count
toward the index. Delete it once you add real entries.)

## Schema (the done-gate (R6))

Every entry follows the same format.

**Status enum** (lifecycle states):
- `open`: captured but not yet started
- `in-progress`: branch open, commits landing
- `in-review`: PR open, review passes running
- `in-qa`: owner manually verifying user-facing behavior
- `done`: merged + verified (`Verified by` >= `NextScrum-manual`)
- `punted`: explicitly deferred
- `blocked`: needs external unblock
- `superseded`: replaced by another SPEC-NNN

**Verified by** field, required for `done` (ranked, lowest to highest):
- `tests-only`: unit/structural tests pass; NOT enough for done
- `agent-chain-trace`: cross-layer trace / code review / database review ran cleanly; NOT enough for done
- `NextScrum-manual (YYYY-MM-DD)`: **minimum for done**; the owner drove the user-facing behavior and confirmed
- `production-smoke`: post-deploy smoke (highest)
- `n/a: <reason>`: for items the owner does not test (pure docs, internal tooling); requires justification

**The done-gate (R6) (verification ladder):** an entry cannot move to
`status: done` until `Verified by` reaches at least `NextScrum-manual`. The
levels are ordered:

```
tests-only  <  agent-chain-trace  <  NextScrum-manual  <  production-smoke
```

`tests-only` and `agent-chain-trace` are real progress but are NOT
sufficient to close an entry; a green suite and a clean trace can both pass
while the user-facing behavior is still wrong. Only the owner driving the
behavior by hand (`NextScrum-manual`) clears the gate.

**NextScrum-manual signal:** the owner types `verified SPEC-NNN` in chat to
confirm; the main session updates the entry. `reject SPEC-NNN: <reason>`
keeps the entry at `in-review`.

Gate: `scripts/check-ledger-done-gate.mjs` (called by `npm run audit:rules`)
refuses commits if any `done` entry is below `NextScrum-manual`.

**Acceptance criteria:** every entry MUST
include an `Acceptance criteria (UAT):` field: 3-7 concrete checks the owner
performs manually to call it done. Without a written checklist, every
verification round checks different things and bugs slip. Acceptance criteria
say *what* to verify; they are tested under R8 (every criterion referenced by
a test) and the done-gate (R6) says *when* it counts as done. Schema:

```
- **Acceptance criteria (UAT):**
  1. <concrete check, action + expected result>
  2. ...
```

New entries get this field BEFORE any code. Existing entries get it on
first revisit.

---

## Open

<!-- EXAMPLE ENTRY: delete this once you have real entries. It is here so a
     fresh reader can see a complete, correctly-shaped ledger row. It maps
     1:1 to docs/specs/000-example-feature/. -->

### SPEC-000 (2026-06-07): Export a report as CSV [EXAMPLE, delete me]

- **Status:** open (plan approved; build not started)
- **Spec folder:** `docs/specs/000-example-feature/` (spec + plan + tasks + tests in the SPEC-SYSTEM format)
- **Verified by:** pending (needs NextScrum-manual: download an export and confirm the file opens cleanly in a spreadsheet)
- **From:** product owner: "let users export the report they are viewing as a CSV they can open in a spreadsheet."
- **Why:** the report is view-only today; users re-key numbers into a spreadsheet by hand. A one-click CSV export removes that manual step and is a small, well-bounded first feature to demonstrate the spec system end to end.
- **Acceptance criteria (UAT):**
  1. Open any report, click "Export as CSV"; a `.csv` file downloads with the report id and today's date in the filename.
  2. Open the file in a spreadsheet; columns and rows match the on-screen table, header row first.
  3. Export a report that currently has zero rows; the file is the header row only (not an error, not an empty file).
  4. While the export is running, the Export button is disabled and shows a busy state; it re-enables when the download starts.
  5. A value beginning with `=`, `+`, `-`, or `@` is escaped so a spreadsheet does not treat it as a formula.
- **Notes:** worked example for the kit. Touches UI (the button), backend (the export endpoint), and the data layer (the report query); therefore it gets a folder, not an inline row. Mandatory test floor: functional + security + accessibility (see `tests.md`).

---

## In progress

(none)

## In review

(none)

## Done

(none)

## Punted

(none)

## Blocked

(none)

## Superseded

(none)
