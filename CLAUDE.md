# CLAUDE.md - <PROJECT>

> Loaded automatically by Claude Code at the start of every session. Keep concise.
> Detailed context lives in `.claude/rules/`, module-level `CLAUDE.md`, and `docs/`.
>
> This file ships from nextscrum-specs-kit as a template. Replace every
> `<PLACEHOLDER>` and the example rows below with this project's reality, then
> delete this banner.
>
> **New to this kit? Read `GETTING-STARTED.md` first** (a step-by-step first run),
> then `README.md` (the daily loop and scenarios). This file is the per-project
> brain once you are set up.

## What this project is

<One paragraph: what the product does, for whom, and the single sentence that
makes it different. Keep it honest and specific.>

**Owner:** NextScrum.

## Architectural decisions (locked)

> List the decisions that are settled and should not be re-litigated. Each one
> points to an Architecture Decision Record (ADR) under `docs/decisions/`.

1. <Decision one.> See `docs/decisions/0001-...md`.
2. <Decision two.>
3. <Decision three.>

## Rules index (the audit page - if a rule is not here, it is not locked)

Every rule lives in one numbered sequence. R1-R8 are the kit's core rules,
enforced by `npm run audit:rules` and the husky hooks. A fork adds its own rules
by continuing from R9. A rule that is not machine-checked is not locked, so each
one names what enforces it.

| # | Rule | Enforced by |
|---|---|---|
| R1 | **No em dashes** in user-facing copy. | `scripts/rules/06a-em-dashes.mjs` + `.husky/commit-msg` |
| R2 | **No banned words** in client-facing copy. | `scripts/rules/06b-banned-words.mjs` |
| R3 | **No AI attribution** in commits (no `Co-Authored-By`, no AI tells). | `scripts/rules/07-no-ai-coauthor.mjs` + `.husky/commit-msg` |
| R4 | **Conventional Commits** (`type(scope): subject`). | `.husky/commit-msg` |
| R5 | **Review markers** on commits that touch sensitive file patterns. | `scripts/check-review-markers.mjs` + `.husky/commit-msg` |
| R6 | **Done-gate:** no ledger entry reaches `done` below `NextScrum-manual`. | `scripts/check-ledger-done-gate.mjs` |
| R7 | **Spec references resolve:** no dangling links, no dependency cycles, facts-to-record targets exist. | `scripts/rules/23-spec-refs.mjs` |
| R8 | **Acceptance criteria are tested:** every EARS criterion is referenced by a test. | `scripts/rules/25-test-coverage.mjs` |
| R9+ | *Your project rules continue here.* | the check you pin for each |

All R1-R8 are **script-enforced** (mechanical). A rule with no machine check is a
**convention** (trust plus review); prefer a script when you add one. The audit
also runs warn-only auxiliary checks (doc-orphans, spec-change-ripple,
record-facts-ripple) and two configurable guards (banned-patterns, surface-ripple)
that stay inert until you point them at your project. Full reference:
[docs/rules/README.md](docs/rules/README.md).

Add a rule with the `/rule` command: it assigns the next number, appends a row
here, and scaffolds the enforcing check under `scripts/rules/` so the rule cannot
drift into advice.

## Repo layout

```
<project>/
├── CLAUDE.md                ← this file (always loaded)
├── HANDOFF.md               ← updated before /compact, read after
├── .claude/rules/           ← how the AI agent APPLIES the rules (auto-loaded)
├── docs/
│   ├── SPEC-SYSTEM.md       ← how a spec becomes its tests
│   ├── requirements.md      ← the ledger (single source of truth)
│   ├── rules/               ← what the rules ARE (the audit page, for humans)
│   ├── specs/NNN-name/      ← spec.md, plan.md, tasks.md, tests.md per feature
│   └── decisions/           ← ADRs
├── scripts/rules/           ← how the rules are ENFORCED (the checkers)
└── <your source dirs>
```

> The three `rules` folders do not overlap: `docs/rules/` is what the rules
> **are**, `.claude/rules/` is how the agent **applies** them, `scripts/rules/`
> is how they are **enforced**.

## Session protocol

**At start of every Claude Code session:**
1. Read this file.
2. Read `HANDOFF.md` if it exists.
3. Read the most recent file in `docs/sessions/`.
4. Read the module `CLAUDE.md` of whatever you are touching, if it exists.

**During the session:**
- Non-trivial decisions get a one-line note in the current session log.
- Logical chunks get a commit with a clear Conventional message.
- Cross-layer changes invoke the matching dev-workflow agent before you claim
  the feature works (see the review-marker trigger map in `.claude/rules/engineering.md`).
- When context approaches ~60% of the window, update `HANDOFF.md` proactively.

**Before marking any requirement `done`:** it must carry acceptance criteria
(R8) and reach at least `NextScrum-manual` verification (R6). The
done-gate refuses commits that violate this.

## Stack-specific notes

> RESKIN: document the stack here for a developer new to it. Which database,
> which test runner, which framework conventions, where business logic lives.
> Point at the module `DEV-NOTES.md` files if you keep them.
