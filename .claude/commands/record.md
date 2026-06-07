---
description: Record Facts stage. On landing, update the architecture docs (ADRs + design docs) a spec listed, so the recorded truth matches what was built.
argument-hint: SPEC-NNN
---
<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

Run the **Record Facts** stage for the spec named in the argument (for example
`/record SPEC-014`). This is the step in `docs/SPEC-SYSTEM.md` that is
easiest to skip and the most costly to miss: it keeps the architecture docs
true after a feature lands.

## Steps

1. **Read** the spec's `plan.md` "Facts to Record" list.

2. **Update each listed doc** so it states what is now true:
   - Architecture Decision Records in `docs/decisions/` for decisions the
     feature settled (use the template in `docs/decisions/`).
   - Design docs in `docs/architecture/` for contracts and shapes worth
     preserving.

3. **Do it in the landing commit.** Recording facts is part of finishing the
   feature, not a follow-up. The same commit that lands the code edits the
   docs it listed. The spec-reference check verifies the listed targets exist.

4. **Then verify and close.** A spec moves to `done` only when its verification
   reaches at least the manual level (the done-gate); the ledger check enforces
   this.

## Output

The docs updated, a one-line note on each decision recorded, and confirmation
that every Facts-to-Record target now exists.
