<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# `.claude/` - Claude Code configuration for this project

> Everything in here is loaded by Claude Code (Anthropic's CLI agent). It is NOT executable by the product runtime.

## Contents

| Path | What |
|---|---|
| `agents/` | Sub-agent definitions (Markdown). Each file describes one specialist agent that the main session can invoke. |
| `commands/` | Slash-command definitions (`/qa`, `/handoff`, `/checkqueue`, `/audit`, `/walkthrough`, `/explain`, `/clean`, `/feature`, `/spec-tests`). Invoked by typing the slash form in Claude Code. |
| `rules/` | Path-scoped rule files auto-loaded at session start (e.g. `engineering.md`). |
| `skills/` | Skill files (if present). Lower-level than commands. |
| `settings.json` | Project-level Claude Code settings (hooks, permissions). |
| `settings.local.json` | Per-developer overrides (gitignored permission cache; safe to leave dirty). |

## Sub-agent system

Seven sub-agents live in `agents/`. Each catches a class of bug that the main session, the pre-commit hooks, or the test suite cannot see alone.

| Agent | When the main session invokes it | Required marker in commit message |
|---|---|---|
| `requirements-ledger` | After any user message containing a new ask | none |
| `handoff-writer` | Before `/compact` or end of session | none |
| `mockup-checker` | After UI change that has a mockup reference | none |
| `playwright-runner` | After every fix, every feature, every cross-layer change | none |
| `chain-tracer` | Before claiming a cross-layer feature works | `[chain-tracer-ok]` (per the review-marker map) |
| `code-reviewer` | After the pre-commit hooks pass, before milestone announcement | (not in trigger map; invoke at milestone boundaries) |
| `db-reviewer` | When schema, migrations, or query code changes | `[db-reviewer-ok]` (per the review-marker map) |

The trigger map is enforced by `scripts/check-review-markers.mjs` via the `commit-msg` hook. Full table in `rules/engineering.md` under "Review-marker trigger map".

## Why the agents live in Markdown

Each agent is invoked as a fresh sub-context. The Markdown file IS its system prompt. Editing the file changes the agent's behavior on next invocation. No build step, no compile; just save and re-run.

## Dev tooling, not product code

Everything in `.claude/` must run inside Claude Code, not against any LLM API directly. No product-SDK imports anywhere in this folder. If the product itself calls an LLM, that lives behind one server-side router; the dev tooling here never touches it.