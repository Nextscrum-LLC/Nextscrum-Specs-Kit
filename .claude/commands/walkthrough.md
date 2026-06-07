---
description: Formal post-deliverable code walkthrough. Run after a non-trivial deliverable or spec lands, to teach the change rather than just diff it.
argument-hint: feature-or-spec
---
<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

After a non-trivial deliverable or spec lands, walk the team through the code in
detail. The goal is to teach how the change fits, not just to show the diff.

## What to cover

For the deliverable or spec identified by the argument (or the most recent one if
no argument), produce:

### 1. Files created - one section each

For each new file:
- **Path:** clickable markdown link
- **Purpose:** one paragraph
- **Key functions:** for each non-trivial export, 2-3 sentences on what it does
- **Design choices:** what alternatives were rejected, why
- **Prior-art analogue:** if a well-known system solves this the same way

### 2. Files modified - diff-style summary

For each modified file:
- **Path** + **what changed** (one paragraph)
- **Why** (link to the HANDOFF item or ADR)
- **Known issues fixed** (link to the post-mortem entry if applicable)

### 3. Bugs found and fixed along the way

Even if not the focus, list bugs you noticed and patched:
- File:line
- What was wrong
- What it now does

### 4. Bugs found and deferred

- File:line
- Why we are not fixing now
- Tracked where (HANDOFF, issue tracker, comment)

### 5. What is NOT in this deliverable (deferred)

Be honest. If the spec said feature X but feature X did not land, say so.

### 6. Acceptance test result

Run the spec's acceptance test. Show the output. Pass or fail.

### 7. Next action

One-line pickup point for whoever continues.

## Voice

- Pedagogical: assume a capable developer who is new to this specific codebase.
- Concrete and opinionated, with prior-art analogues where they help.
- File:line references for anything specific.
- No skipping to "and then it works"; explain how each piece fits.

## Where the walkthrough lives

Append it to today's session log (`docs/sessions/YYYY-MM-DD-NN.md`) under a
`## Walkthrough` section. The log file is the durable record; the chat message is
just for live review.

## When NOT to run

- Mid-build: wait for the deliverable to be complete.
- For trivial changes (a typo fix, a one-line config bump).
- If `/qa` has not passed yet: the walkthrough is for QA-green code.
