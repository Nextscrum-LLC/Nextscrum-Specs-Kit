<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# Re-skin this kit

Paste this whole file as your first message into a fresh Claude Code session
opened in the new project. It tells the session how to adapt the kit to this
project's stack. Work the steps in order and confirm each before moving on.

## Context for the session

You are looking at a forked copy of nextscrum-specs-kit: a stack-neutral
engineering operating system (spec-driven development, machine-enforced
discipline, and seven dev-workflow agents). It was extracted from a product repo
and genericized. Your job is to re-skin it for THIS project.

THIS PROJECT IS:
<Replace with one paragraph: the product, the stack (language, framework,
database, test runner), the repositories involved, and anything already decided.>

## Ground rules while you work

- Do NOT touch the spec engine, the done-gate, the test-naming scheme, or the
  quality-budget structure. Those are the value and they are stack-neutral.
- NO em dashes in anything you write (use parens, semicolons, or two sentences).
- NO AI attribution in code comments or commits.
- Every change you make should be greppable later: leave a short comment where a
  human still needs to decide something.

## Steps

1. **Map first.** Read `CLAUDE.md`, then `.claude/rules/engineering.md`, then
   `docs/SPEC-SYSTEM.md` and `docs/TESTING-SYSTEM.md`. Build a mental model
   before editing. Report a two-line summary of what the kit enforces.

2. **Find every placeholder.** Grep the kit for `RESKIN` and for `<` angle-bracket
   placeholders. Produce the full to-do list. Everything below is a subset of
   that list; if grep finds more, handle those too.

3. **Re-skin the agents** (`.claude/agents/`):
   - `db-reviewer.md`: set `<DB_ENGINE>` to this project's database; rewrite the
     SQL-safety checklist for that engine's parameterisation idiom.
   - `chain-tracer.md`: replace the generic layer names with this project's real
     call chain (UI → backend → data → render).
   - `playwright-runner.md`: set `<E2E_RUN_COMMAND>`, `<UNIT_TEST_COMMAND>`,
     `<BACKEND_HEALTH_URL>` to real values.
   - `mockup-checker.md`: point it at this project's UI component framework, or
     delete it if there are no mockups.

4. **Re-skin the review-marker surface** (`scripts/check-review-markers.mjs` and
   the R21 trigger map in `.claude/rules/engineering.md`): set the file globs to
   this project's sensitive directories (database, services/routes, UI). The
   marker mechanism stays; only the patterns change.

5. **Re-skin the voice scan** (`scripts/rules/06a-em-dashes.mjs`,
   `06b-banned-words.mjs`): set `USER_FACING_DIRS` / `USER_FACING_FILES` to the
   folders that hold client-facing copy. Edit the banned-word list if this
   project has its own.

6. **Re-skin the hooks** (`.husky/pre-commit`, `pre-push`): set the test command
   to this project's runner. Set `<VERSION_FILE>` in `pre-push` if you track a
   version file.

7. **Re-skin the quality budgets** (`docs/quality-budgets.md`): replace the
   example numbers with this project's real performance, accessibility, size,
   and reliability budgets.

8. **Fill in CLAUDE.md**: the project description and the locked decisions. Keep
   the kit's rules (R1-R8 mechanical core, R9-R11 plus R13 engineering disciplines,
   R12 file headers) in the rules index; add your own rules by continuing the
   sequence from R14 (the `/rule` command scaffolds each one). For every rule, pin
   a check in `scripts/rules/` so it cannot drift. Set the header owner and license
   in `scripts/rules/29-ip-headers.mjs`, then run `npm run headers:fix`. For R13,
   adopt the reference logger in `examples/logger/` (or your stack's logger) and,
   if you want "no bare console" locked, point the `banned-patterns` guard at your
   app source.

9. **Empty the ledger** (`docs/requirements.md`): delete the SPEC-000 example
   entry, keep the schema, the verification-level legend, and the field
   definitions.

10. **Delete the teaching artifact**: remove `docs/specs/000-example-feature/`
    after the team has read it (ask before deleting; some teams keep it).

11. **Verify the rails are live**: run `npm install`, `npm run prepare`, then
    `npm run audit:rules`. Fix anything that references a path you changed or
    removed. Green means the kit is wired to this project.

12. **Report**: list every file you changed and every placeholder still
    outstanding that needs a human decision.

## Manifest (what is stack-neutral vs what you re-skin)

KEEP AS IS (stack-neutral, the value):
- `docs/SPEC-SYSTEM.md`, `SPEC-PLAYBOOK.md`, `TESTING-SYSTEM.md`
- `scripts/audit-rules.mjs`, `scripts/check-ledger-done-gate.mjs`
- `scripts/rules/07-no-ai-coauthor.mjs`, `22-done-gate.mjs`, `23-spec-refs.mjs`,
  `25-test-coverage.mjs`, `90-doc-orphans.mjs`
- `.claude/agents/{code-reviewer,handoff-writer,requirements-ledger}.md`
- `.claude/commands/*`
- the ledger schema, the done-gate, the verification levels, the test-naming scheme

RE-SKIN (swap stack tokens):
- `.claude/agents/{db-reviewer,chain-tracer,playwright-runner,mockup-checker}.md`
- `.claude/rules/engineering.md` (R21 trigger map)
- `scripts/check-review-markers.mjs`, `scripts/rules/{06a,06b,21}.mjs`
- `.husky/{pre-commit,pre-push}`
- `docs/quality-budgets.md`, `CLAUDE.md`

DECIDE (project-specific, may drop):
- `mockup-checker` (drop if no mockups)
- the LLM router and sanitiser mentions in `engineering.md` (drop if no AI feature)
