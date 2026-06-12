<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# AGENTS.md

> Cross-tool entry point following the [agents.md](https://agents.md) spec. Any AI
> coding assistant (Claude Code, Cursor, Codex CLI, Continue, and others) should
> read this file at the start of every session and obey the rules it points to.
> Claude Code users get the same rules through `CLAUDE.md`, which loads automatically.

## Read this first, in order

1. **`CLAUDE.md`** is the canonical project rule set and the rules index. Read it in full.
2. **`HANDOFF.md`** (if present) describes the current branch state. Read it after `CLAUDE.md`.
3. The most recent file in **`docs/sessions/`** gives continuity from prior sessions.
4. The module-level `CLAUDE.md` for whatever you are about to touch, if one exists.

## What this project is

> RESKIN: one paragraph. What the product does, for whom, and the single sentence
> that makes it different. Keep it honest and specific. Mirror the "What this
> project is" section of `CLAUDE.md` so the two never disagree.

## The rules are machine-enforced

Every commit is checked against the rules in `CLAUDE.md`. The hooks live in
`.husky/`; the audit script is `scripts/audit-rules.mjs`. Run it any time:

```bash
npm run audit:rules
```

The rules the kit ships (full text and the exact enforcer live in the `CLAUDE.md`
rules index, which is the source of truth; this is a pointer):

- **R1-R2 Voice:** no em dashes, no banned words in user-facing copy.
- **R3-R4 Commits:** Conventional Commits; no AI attribution or co-author trailer.
- **R5 Review markers:** a change to a sensitive path carries the marker for its review agent.
- **R6 Done-gate:** no ledger entry reaches `done` before a human has verified it.
- **R7-R8 Specs:** every spec reference resolves; every acceptance criterion is tested.
- **R9 External-system grounding:** never state third-party API behavior from memory; cite a source.
- **R10 Platform-limitation registry:** confirmed upstream limits are recorded under `docs/platform-limitations/`.
- **R11 Boundary-case-first:** handle the edge cases in the same pass; list them in the spec's `plan.md`.
- **R12 File headers:** every source file carries the copyright header.

A fork's own rules continue from R13.

## Pre-commit machinery

Every `git commit` runs, via husky:

1. `scripts/audit-rules.mjs` (voice, AI attribution, spec refs, coverage, headers, and more).
2. The project test command.
3. `.husky/commit-msg` (Conventional Commits, no AI trailer, required review markers).

`git push` additionally re-runs the tests and warns on version drift. A change
that breaks a rule is refused here, not in review.

## Repo layout

```
<project>/
├── AGENTS.md                ← this file (cross-tool entry)
├── CLAUDE.md                ← canonical project rules (Claude Code auto-loads)
├── HANDOFF.md               ← current branch state, updated before /compact
├── README.md                ← overview, the daily loop, scenarios
├── .husky/                  ← git hooks (commit-msg, pre-commit, pre-push)
├── scripts/                 ← the rule checkers (audit-rules.mjs + scripts/rules/)
└── docs/
    ├── SPEC-SYSTEM.md        ← the lifecycle: Rules to Specify to Plan to Build to Record
    ├── requirements.md       ← the ledger (single source of truth)
    ├── specs/NNN-name/       ← spec.md, plan.md, tasks.md, tests.md per feature
    ├── decisions/            ← ADRs
    └── sessions/             ← one log per working session
```

> RESKIN: add this project's real source directories below `scripts/` and `docs/`.

## When in doubt

Ask the owner before guessing. The cost of pausing to confirm is low; the cost of
a wrong commit that lands against the rules is higher. The spec system exists so
the "what" is written down before the "how" begins. Start at `docs/SPEC-SYSTEM.md`.
