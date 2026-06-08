<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# Rules and checks

This is the audit page: every rule the kit enforces, and exactly what enforces
it. The governing principle is simple. **A rule that is not machine-checked is
not locked.** So each rule names its check, and a rule with no check is a
convention (trust plus review), not a locked rule.

Add a rule with the `/rule` command: it assigns the next number, appends a row
here and in `CLAUDE.md`, and scaffolds the enforcing check.

> **Three folders are named `rules`; they do not overlap.** `docs/rules/` (this
> page) is what the rules *are*, for humans. `.claude/rules/` is how the AI agent
> *applies* them (path-scoped instructions Claude Code auto-loads). `scripts/rules/`
> is how they are *enforced* (the executable checkers). Are -> apply -> enforce.

## Core rules (R1-R8)

These are the kit's locked rules. All are **script-enforced** (mechanical), run
by `npm run audit:rules` and the husky hooks. A fork continues the sequence from
R9 for its own rules.

| # | Rule | Type | Enforced by |
|---|---|---|---|
| R1 | No em dashes in user-facing copy | script | `scripts/rules/06a-em-dashes.mjs` + `commit-msg` |
| R2 | No banned words in client-facing copy | script | `scripts/rules/06b-banned-words.mjs` |
| R3 | No AI attribution in commits | script | `scripts/rules/07-no-ai-coauthor.mjs` + `commit-msg` |
| R4 | Conventional Commits | script | `.husky/commit-msg` |
| R5 | Review markers on sensitive-path changes | script | `scripts/check-review-markers.mjs` + `commit-msg` |
| R6 | Done-gate (no `done` below `NextScrum-manual`) | script | `scripts/check-ledger-done-gate.mjs` |
| R7 | Spec references resolve (no dangling links or cycles; facts-to-record targets exist) | script | `scripts/rules/23-spec-refs.mjs` |
| R8 | Acceptance criteria are tested | script | `scripts/rules/25-test-coverage.mjs` |

> Type tells you whether a rule is **script** (mechanical, cannot drift) or
> **convention** (relies on a human running it). The kit ships only script rules.
> When you add a rule, prefer a script so it stays locked; if a rule is genuinely
> behavioral and cannot be checked, mark it `convention` so the gap is visible.

## Auxiliary checks (warn-only)

These run in the audit but do not block; they surface drift so it does not pile
up. They are quality nudges, not locked rules.

| Check | What it warns about | Where |
|---|---|---|
| doc-orphans | Markdown files with no inbound links | `scripts/rules/90-doc-orphans.mjs` |
| spec-change-ripple | A spec's `spec.md` was edited without updating its `tasks.md` and `tests.md`, leaving the work-breakdown or tests stale | `scripts/rules/26-spec-change-ripple.mjs` |
| record-facts-ripple | A spec was completed without updating the architecture docs its `plan.md` lists under "Facts to Record" | `scripts/rules/24-record-facts-ripple.mjs` |

The two ripple checks close the propagation gaps in the spec lifecycle: a
requirement change cannot silently leave its tasks and tests behind, and a
completed feature cannot silently leave the recorded truth stale.

## Configurable guards (off by default)

These are reusable engines that ship inert. You point them at your own project
to turn a convention into a machine check. They are the generic form of the
project-specific guards a mature codebase grows.

| Guard | What it does | Configure in |
|---|---|---|
| banned-patterns | Scans chosen file globs for forbidden code patterns (with an auditable per-line opt-out), and fails on a match | `scripts/rules/40-banned-patterns.mjs` (config block at top) |
| surface-ripple | Requires a safety or decision doc to be updated whenever a sensitive surface (a glob) is touched | `scripts/rules/41-surface-ripple.mjs` (config block at top) |

Example uses: a WordPress fork bans unescaped output in `theme/**`; a Laravel
fork bans `DB::raw` in `app/**`; any project requires a schema-decision doc
whenever `migrations/**` changes. The engine is the same; you supply the config.

## The doc -> rule reverse-lookup banner (convention)

This page is the **forward** lookup: rule -> where it lives -> what enforces it.
The **reverse** lookup is just as important. When you are reading a doc (an ADR,
a design doc, a runbook), you should be able to see at a glance which rule
governs it without first knowing that rule exists. A doc that elaborates a rule,
or whose content a rule protects, carries a one-line banner at the very top that
links back to the rule and to this index.

Two banner shapes, by relationship:

- **Detail home** (the doc *is* the rule's long-form rationale):
  `> **Backs rule RN** (short name). See the [rules index](README.md).`
- **Governed by** (the doc records something a rule protects from regressing):
  `> **Relates to RN** (short name): <one line on the link>. See the [rules index](README.md).`

The banner sits above any other front-matter note, on its own line. Keep it to a
sentence or two; its job is the link, not the explanation.

**Where it applies in the kit today.** The core rules (R1-R8) are one-line,
script-enforced rules with no separate detail doc, so none needs a "Backs rule"
banner yet. The worked example shows the "Relates to" shape: the example ADR
[`0002-example-decision.md`](../decisions/0002-example-decision.md) carries a
banner back to R8, because the security invariant it records is locked by a
tested acceptance criterion. As a fork grows rules that need their own detail
docs (continuing from R9), give each such doc a "Backs rule" banner so the
reverse lookup never goes stale.
