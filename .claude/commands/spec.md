---
description: Specify stage. Turn a raw ask into a spec (what + why) with EARS acceptance criteria. Creates the spec folder or an inline ledger row per the folder-vs-inline threshold.
argument-hint: short-feature-name
---
<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

Write the spec for the feature named in the argument (for example
`/spec export-customers`). This is the **Specify** stage of the loop in
`docs/SPEC-SYSTEM.md`. Output is the *what and why*, not the *how*.

## Steps

1. **Decide folder vs inline.** Apply the three-question test in
   `docs/SPEC-SYSTEM.md` (more than one layer? more than one or two commits?
   needs a written contract before coding?). Any yes means a folder under
   `docs/specs/NNN-name/`; all no means a single ledger row.

2. **Add the ledger row** in `docs/requirements.md`: id, title, status
   `in-progress`, owner, and the acceptance-criteria and verification fields.

3. **Write `spec.md`** (folder specs) with:
   - **Why:** the problem and the value, in two or three sentences.
   - **Acceptance criteria** in EARS (the WHEN/WHILE/IF/WHERE/SHALL templates
     in `docs/SPEC-SYSTEM.md`). Number them C1, C2, ... ; these numbers are
     immutable and become the test trace ids.
   - **Rules touched:** which project rules this change must obey.
   - **Relationships:** parent, depends-on, blocks, supersedes (use real ids).

4. **Stop at the boundary.** Do not design or list files here; that is the
   Plan stage. Ask the user only the questions the ask genuinely leaves open.

## Output

The spec path, the criteria count, and a one-line note on each open question
that still needs the user before planning can start.
