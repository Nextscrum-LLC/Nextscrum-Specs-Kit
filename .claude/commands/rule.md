---
description: Add a new project rule to the audit page and scaffold its enforcing check, so the rule is locked rather than advisory.
argument-hint: short rule description
---
<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

Add a rule to the kit's numbered audit page. The kit's principle is that a rule
which is not machine-checked is not locked, so adding a rule is two coupled steps
and this command does both: it records the rule and scaffolds the check that
enforces it.

## Steps

1. **Clarify the rule.** Restate it as one enforceable sentence (what is banned or
   required, and where). If it cannot be checked mechanically, say so and stop; an
   unenforceable rule belongs in a guideline doc, not the audit page.

2. **Assign the next number.** Read the Rules index table in `CLAUDE.md`, find the
   highest `R#`, and use the next integer. The kit ships R1-R8; a project's own
   rules continue from R9.

3. **Append the row** to the Rules index in `CLAUDE.md`: the number, the rule in
   bold, and what enforces it (the check file you create in the next step).

4. **Scaffold the check** under `scripts/rules/` as `NN-slug.mjs` (NN is a
   two-digit ordering prefix; slug is a short kebab-case name). The orchestrator
   `scripts/audit-rules.mjs` auto-discovers every `scripts/rules/*.mjs`, so the new
   file is enrolled the moment it exists. The check must:
   - export the function the orchestrator runs,
   - print `R# slug: <result>` so its output matches the other checks,
   - exit non-zero only on a real violation (warn-only checks print a `!` line and
     do not fail the build),
   - include a `--self-test` block (copy the shape from a sibling check).

5. **Wire the enforcement timing.** If the rule should also block commits, add it
   to the relevant husky hook (`.husky/pre-commit` or `.husky/commit-msg`). If it
   gates a file pattern, add the pattern to the review-marker trigger map in
   `.claude/rules/engineering.md`.

6. **Prove it is locked.** Run `npm run audit:rules` (the new check appears in the
   output) and run the check's `--self-test`. Both green means the rule is locked.

## Output

The new rule number, the row added to `CLAUDE.md`, the check file created, and a
one-line note on how it is enforced (audit only, or audit plus a commit hook).
