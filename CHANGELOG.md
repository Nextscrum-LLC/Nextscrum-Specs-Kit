# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
