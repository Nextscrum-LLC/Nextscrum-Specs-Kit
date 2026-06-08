# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- `docs/rules.md`: a single Rules reference page (every rule and check, and what
  enforces it), linked from the docs site.
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
