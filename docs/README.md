<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# docs map

Where everything lives, so you do not have to grep.

## The spec-and-test engine

- `SPEC-SYSTEM.md` - the lifecycle loop: Rules → Specify → Plan → Analyze →
  Build → Record Facts. Read this first.
- `SPEC-PLAYBOOK.md` - the chat-driven control surface (signal phrases + slash
  commands), the protective gates, and worked say-this/this-happens scenarios.
- `TESTING-SYSTEM.md` - how a spec becomes its tests: the clarify pass, the
  ISO/IEC 25010 dimension matrix, the mandatory floor (functional + security +
  accessibility), and the `SPEC-NNN/C#/dimension/case` naming scheme.
- `quality-budgets.md` - the concrete numbers and invariants tests assert
  against. Re-skin per project.
- [COMPARISON.md](COMPARISON.md) - how this kit compares to GitHub Spec Kit,
  Kiro, OpenSpec, BMAD, Tessl, and Claude Code native, and the one idea
  (enforcement over generation) that sets it apart.

## The ledger

- `requirements.md` - the single source of truth for what is asked, in progress,
  and done. Carries acceptance criteria (tested under R8) and the
  done-gate (R6). Ships empty with one worked example to delete.

## Per-feature specs

- `specs/NNN-name/` - one folder per feature, four files: `spec.md` (EARS
  criteria), `plan.md` (the how + facts to record), `tasks.md` (the work,
  each task naming the criterion it satisfies), `tests.md` (the coverage matrix
  tracing every criterion).
- `specs/000-example-feature/` - a tiny worked example ("export a report as
  CSV"), fully consistent end to end. A teaching artifact; delete once read.

## Decisions, sessions, post-mortems

- `decisions/` - Architecture Decision Records (ADRs). Format + template inside.
- `sessions/` - one log per working session. Handoff discipline.
- `post-mortems/` - when something breaks, the template captures cause and the
  rule change that prevents a repeat. See [post-mortems/README.md](post-mortems/README.md).
- `platform-limitations/` - confirmed hard limits in third-party platforms
  (PL-NNN), recorded under R10 with primary sources and a re-verify date. See
  [platform-limitations/README.md](platform-limitations/README.md).

## Dev-workflow agents

The seven Claude Code agents live in `.claude/agents/`. The three stack-neutral
ones you keep as is:

- [code-reviewer](../.claude/agents/code-reviewer.md) - deep multi-dimension review at milestone boundaries.
- [handoff-writer](../.claude/agents/handoff-writer.md) - updates HANDOFF.md and writes the session log before /compact.
- [requirements-ledger](../.claude/agents/requirements-ledger.md) - maintains `requirements.md` as the single source of truth.

The other four (chain-tracer, db-reviewer, playwright-runner, mockup-checker)
are re-skinned per stack; see `.claude/rules/engineering.md`.

## Tooling (optional, ships inert)

- [agent-telemetry.md](agent-telemetry.md) - the schema and read-back recipes for
  the opt-in agent-invocation log (`scripts/log-agent-invocation.mjs`), so you can
  see how often each agent fires and whether the R5 trigger map is well-calibrated.
- `scripts/graph.mjs` (`npm run graph`) - generates a Mermaid module-import graph
  for a source tree. Inert until you set its `SRC_DIR_REL`.
