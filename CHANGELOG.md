<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.10.0]

### Added

- Progressive testing, so the suite accretes and locks failures while individual
  tests stay fixed contracts:
  - **R15 regression-on-fix** (`scripts/check-regression-test.mjs`, commit-msg):
    a `fix:` commit that changes source must add a regression test. Warn by
    default; blocks under `SPECKIT_STRICT=1`; `[no-regression-test: <reason>]`
    opt-out.
  - **test-no-shrink** guard (`scripts/rules/32-test-no-shrink.mjs`): warns when
    a commit deletes a test file or net-removes test lines.
  - **`SPECKIT_STRICT`** flag flips R8 coverage and R15 from warn to block in one
    switch (shared in `scripts/rules/_shared.mjs`).
  - **`/regress`** command: drives the failing-test-first loop.

## [0.9.0]

### Added

- **R14 no-secrets** pre-commit scan (`scripts/rules/31-no-secrets.mjs`): blocks
  a commit whose staged diff adds a private key, an API token, or a
  machine-specific home path. The content-level complement to `.gitignore`.
  Reports file plus pattern name only; `nss-allow` per-line opt-out; `EXTRA_TERMS`
  ships empty so the kit forbids nothing project-specific by default.

## [0.8.1]

### Fixed

- Removed machine-specific paths that had leaked into `.claude/settings.json`
  (auto-recorded permission grants); the tracked policy now holds only
  stack-neutral allow / deny entries.
- Hardened the default `.gitignore` into a broad, multi-stack default (secrets,
  OS and editor junk, build output across stacks, and local Claude settings), so
  personal or sensitive files stay out of git regardless of project type.
- Corrected a stale "proprietary header" reference to "copyright header" in the
  `handoff-writer` agent (the kit is Apache-2.0).

## [0.8.0]

### Added

- R13 observability rule: structured, one-event-per-line logs with a correlation
  id, no secrets or PII, and error events that carry a code anchor
  (`module:function` plus the `SPEC-NNN`) so a developer or an AI agent can debug
  from logs. Convention plus the `code-reviewer` agent.
- `examples/logger/`: a dependency-free reference logger implementing the R13
  standard (correlation id, redaction, code anchor), with a self-test and a demo.

## [0.7.0]

### Added

- `version-sync` configurable guard (off by default): warns when source files are
  staged without the project's version file.
- Agent-invocation telemetry: `scripts/log-agent-invocation.mjs` plus
  `docs/agent-telemetry.md`, an opt-in JSONL log of dev-workflow-agent runs
  (gitignored, per-fork runtime data).
- `scripts/graph.mjs` (`npm run graph`): a zero-dependency module-import Mermaid
  generator, inert until configured.

## [0.6.0]

### Changed

- R12 file-header rule now covers Markdown as well as code; backfilled the
  copyright header into every previously-bare file. Added `npm run headers:check`.

## [0.5.0]

### Added

- R12 file-header rule: every source and docs file carries the copyright header
  (`scripts/rules/29-ip-headers.mjs`; `npm run headers:fix` repairs).
- `AGENTS.md`: a stack-neutral cross-tool entry (agents.md spec) that points back
  to `CLAUDE.md` as the source of truth.

## [0.4.0]

### Added

- Engineering-discipline rules R9-R11: external-system grounding (R9), the
  platform-limitation registry (R10, `docs/platform-limitations/`), and
  boundary-case-first coding (R11), with warn-checks for R10 and R11.

## [0.3.0]

### Added

- The doc -> rule reverse-lookup banner convention: a doc that elaborates a rule,
  or records something a rule protects, carries a one-line banner at the top
  linking back to the rule and the rules index. Documented in
  `docs/rules/README.md` with both banner shapes (`Backs rule` for a detail home,
  `Relates to` for a governed-by doc), and demonstrated on the example ADR
  (`docs/decisions/0002-example-decision.md`, back to R8). The decisions README
  points adopters at the convention.

### Changed

- The rules reference page moved from `docs/rules.md` to `docs/rules/README.md`,
  so the rules now live in a folder with an index page like the other doc folders
  (`docs/decisions/`, `docs/sessions/`, `docs/post-mortems/`). Inbound links in
  `CLAUDE.md`, `_sidebar.md`, and the changelog updated to the new path.

## [0.2.0]

### Added

- `spec-change-ripple` check: warns when a commit edits a spec's `spec.md`
  without updating its `tasks.md` and `tests.md`, so a requirement change cannot
  leave its work-breakdown and tests stale.
- `record-facts-ripple` check: warns when a spec is completed without updating
  the architecture docs its `plan.md` lists under "Facts to Record" (the
  git-aware complement to the static `spec-refs` check).
- `banned-patterns` guard: a configurable engine that scans chosen globs for
  forbidden code patterns, with an auditable opt-out. Inert until configured.
- `surface-ripple` guard: a configurable engine that requires a safety or
  decision doc to be updated whenever a sensitive surface is touched. Inert
  until configured.
- `docs/rules/README.md`: a single Rules reference page (every rule and check,
  and what enforces it), linked from the docs site.
- Rules index now marks each rule as script-enforced or convention.

## [0.1.0]

Initial public release.

### Added

- The spec engine: `docs/SPEC-SYSTEM.md`, `SPEC-PLAYBOOK.md`,
  `TESTING-SYSTEM.md`, `quality-budgets.md`, and the four-file spec structure
  (`spec.md`, `plan.md`, `tasks.md`, `tests.md`) with a fully worked example.
- The enforcement layer: `scripts/audit-rules.mjs` plus rule modules (voice,
  no-AI-attribution, spec references, test coverage, review markers, doc
  orphans), the ledger done-gate, and the husky pre-commit, commit-msg, and
  pre-push hooks.
- Seven Claude Code dev-workflow agents and a set of slash commands covering the
  full loop (specify, plan, tasks, analyze, record-facts, plus qa, audit,
  handoff, and walkthrough).
- A branded documentation website (Docsify) with full-text search.
- OSS hygiene: Apache-2.0 license, contributing guide, code of conduct, continuous
  integration running the audit and the scripts' self-tests.
