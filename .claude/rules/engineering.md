<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# Engineering discipline

> Auto-loaded by Claude Code at session start (path-scoped rule file).
> These extend the locked rules in `CLAUDE.md` with concrete how-tos for
> architecture, security, performance, modularity, and commenting. Every
> section is intended to be enforceable via `npm run audit:rules`.
>
> RESKIN: This file is stack-neutral. Where it names a generic layer
> ("the data-access layer", "the LLM router", "the sanitizer"), point it at
> this project's real module. Delete any subsection that does not apply
> (for example the LLM-routing notes if the product does not call an LLM).

## Architecture conventions

- **Backend layering.** Routes/controllers are thin (validate input, delegate, return the response). The service layer holds the actual logic. DB access goes through one data-access layer (`query` and `tx` helpers); never import the raw DB driver from a route or service.
- **UI separation.** The UI layer renders and dispatches; it does not duplicate business logic or reach into transport internals. Shared helpers live in a pure-utility layer.
- **Processing independence.** Each processing stage is wrapped in a try/catch and logs failures to a durable error sink. One bad item must not stall the queue.
- **No module-level mutable state.** State lives in the DB or a scoped store, not in module-scope variables that span requests.
- **One source of truth per concept.** Selectors live in one place; sanitization in one place; cost/usage tracking in one place. When tempted to duplicate, refactor instead.

## Security baseline

- **Untrusted input gets wrapped.** Anything externally-scraped or user-provided passes through the sanitizer with nonce-bearing delimiters before reaching an LLM prompt. Prevents prompt injection. (Drop this if the product has no LLM.)
- **SQL is always parameterized.** Never interpolate user input into a SQL string. If a query needs a dynamic table or column name, validate it against an allowlist.
- **LLM calls go through one router.** That router enforces rate limits, spend caps, and cost logging. No direct provider-SDK calls from anywhere else. (Drop this if the product has no LLM.)
- **No secrets in client code.** API keys live in server-side env (gitignored). The client only ever talks to the project's own backend. If you need new env vars, add them to `.env.example` with a default value.
- **Privileged-API restraint.** Any client-side use of a powerful platform API (navigation, network interception, code injection, file access) goes through one audited path and is covered by a test. Document the threat model when adding one.
- **SSRF defense for outbound fetch.** Any new fetch from the backend with a user-controlled URL must go through a DNS-pinned + private-range-blocking helper; for now, at minimum document the threat in the route.

## Optimization

- **Cheap-first routing.** Run the cheapest signal that meets the requirement first; don't pay for the expensive path when a cheap one is sufficient. (For LLM products: route the cheap model for filter/classify, the mid model for analysis, the top model only for the highest-stakes generation.)
- **Cache aggressively.** Hot lookups cache by a hash of their canonical inputs (LRU with a bounded size). Outbound fetches cache by URL with a TTL. Embeddings/derived data cache by content key.
- **DB hot paths.** Run `EXPLAIN ANALYZE` (or the engine's equivalent) for any query in a tight loop. Add an index when the planner does a seq scan over a large table on a hot path. Index FK columns by default.
- **UI render discipline.** Diff, don't wipe. Renderers use key-based diffing, patching only the fields that changed. `innerHTML = ""` on a short poll interval is banned (it causes visible jitter).
- **Front-load cheap signals.** Surface what is known cheaply (a pre-score, a partial result) so the UI is useful before the expensive computation finishes.

## Modularity & reusability

- **One concern per file.** A 200-line module that does one thing is better than a 600-line module that does three.
- **Shared utilities go to the lib layer.** If you find yourself implementing the same regex in two places, extract.
- **Service files are independent.** They take their dependencies as imports, not as module-level state. This makes them unit-testable in isolation.
- **Test seams are explicit.** Functions like `_internal_clearCache()` are exposed only for tests.
- **Helpers prefer pure functions.** A formatter takes a row in and returns a string. No side effects. Easy to test.

## External-system grounding (R9)

**The rule:** never describe how a third-party system behaves from training memory. Memory of an external API is a point-in-time snapshot that goes stale; the behavior may have changed, and the exact edge you care about is often under-specified or a known bug. Ground every external-behavior claim before you state it, in design, in review, and in debugging.

**The drill:**

1. **Read the current official docs.** Fetch the authoritative reference for the exact API or option in question and quote the relevant line.
2. **Search prior art.** Search the symptom plus the API name. Read the closest matches: official issue trackers first, then vendor Q&A, then community posts. Someone has usually hit it and posted a fix or a confirmed "known limitation."
3. **State confirmed vs under-specified.** Separate what the docs guarantee from what they leave open. If the docs are silent on the exact behavior, say so; do not fill the gap with a confident guess.
4. **Test empirically when docs are silent.** When the behavior is under-specified or version-dependent, run the minimal runtime check on the target build rather than asserting. A 90-second observation beats a plausible-sounding theory.
5. **Cite sources.** Any decision or root cause that rests on external behavior names the doc or issue it rests on, so the next session can re-check it.
6. **Prefer testable architectures.** When an external API's lifecycle is finicky, prefer a design that keeps the correctness decision in your own code (a round-trip you can unit-test) over one that leans on the platform's implicit, undocumented behavior.

**How it is enforced:** convention, backed by the `code-reviewer` agent. There is no greppable signal for "did you check the docs," but a review can ask "where is the source for this external-behavior claim?" When grounding confirms a hard upstream limitation, record it under R10.

## Platform-limitation registry (R10)

R9 is the discipline (always check docs plus prior art); **R10 is the memory of what that discipline found.** When grounding (R9) confirms a *hard limitation in a third-party platform* (the upstream API genuinely cannot do what you wanted, not a bug in your code), record it once so the next session does not re-derive it from zero.

**Where it lives:** `docs/platform-limitations/` is a `README.md` index (the list, the bar, the template, and the procedure) plus one `PL-NNN-<title>.md` detail doc per limitation.

**The three-part bar (all must hold):** (1) the root cause is upstream, not yours; (2) it is confirmed against primary sources per R9 (official docs plus at least one issue tracker or vendor acknowledgement); (3) it cost real time or constrains a design. A bug in your own code is not a PL record; that gets a fix plus a test plus maybe a post-mortem.

**The load-bearing clause: re-verify, do not trust blindly.** A platform limitation is a point-in-time fact; platforms ship fixes. Every PL record carries a re-verify checklist and a `Last verified` date. Before you rely on a record to make a decision, re-check its sources; if it was fixed upstream, mark it `fixed-upstream`, note the version, and open follow-up work to simplify the workaround.

**One source of truth per concept.** The PL record holds the *limitation*; an ADR holds the *decision* about how to live with it; the rule lives in `CLAUDE.md`. The PL is the hub that links them.

**How it is enforced:** convention plus `scripts/rules/27-platform-limitation-refs.mjs` (warn), which flags any `PL-NNN` reference that does not resolve to a file and any detail doc missing from the index.

## Boundary-case-first coding (R11)

Handle the edge cases **as you write the code**, in the same pass, not as a later cleanup or a thing the reviewer is expected to catch. By the time a function is written, its boundary behavior should already be decided and coded.

**The checklist to run for every function or handler you write** (the ones that apply):

- **Empty / null / missing inputs.** `null`, `undefined`, `[]`, `""`, absent fields, a shape that is one of two valid forms. What renders, returns, or happens?
- **Not-found and error paths.** The not-found / no-row / fetch-failed / rejected-promise branch. Never let it throw unhandled or render a half-state.
- **Limits and counts.** 0, 1, many, the max (page caps, list caps, pagination); off-by-one on indices.
- **Races and stale state.** Two events for the same target; a slow response that resolves after the user moved on; a value captured once that can go stale; timer and subscription cleanup (no leaks).
- **Idempotency.** Calling it twice does not double-write, double-charge, or double-fire.
- **Untrusted data.** Server, model, or third-party text goes through a safe sink (`textContent` / `createElement` / sanitization), never a raw markup sink.

**Make it visible.** In the `plan.md` for a change, list the boundary cases the code handles (a short bullet list per task is enough). When a boundary case is genuinely impossible, say why. This is the same discipline the adversarial review applies from the outside; R11 says do it from the inside first so the review finds nothing.

**How it is enforced:** convention plus `scripts/rules/28-boundary-cases.mjs` (warn), which flags a staged `plan.md` that has no "Boundary cases" section.

## Observability (R13)

Production bugs are found and fixed from logs. Make the logs serve both a developer and an AI coding agent: structured enough to parse, correlated enough to reconstruct one request, and anchored enough to jump from a log line to the code that emitted it.

**The standard (every shipped error path obeys it):**

- **Structured, one event per line.** Log a JSON object, never a bare string. Stable field names, so the logs are greppable by a person and parseable by a tool or an agent.
- **A correlation id per unit of work.** Generate an id at each entry point (an HTTP request, a queue job) and thread it through every line for that work, so one request's whole path is reconstructable from a single grep. (Node: `AsyncLocalStorage`; other stacks: a context variable.)
- **Levels mean something.** `debug` for development detail, `info` for normal lifecycle, `warn` for recoverable issues, `error` for actionable failures. Not everything is `info`.
- **No secrets or PII in logs.** Redact credentials, tokens, and personal data by key, at the logging boundary, before anything reaches a sink.
- **Errors are debuggable by a person or an agent.** An error event carries the message and stack (never a bare string), the operation, the inputs that mattered (redacted), the correlation id, and a code anchor (`module:function`) plus, when known, the `SPEC-NNN` it implements. That anchor is what lets an agent move from a production log line to the spec, plan, tests, and code without guessing.
- **One logging entry point.** No bare `console.*` in shipped application code; route everything through the one logger (one source of truth per concept). Persistent failures also route to the error queue (`docs/error-queue.md`, surfaced by `/checkqueue`), so there is a single place to triage.

**How it is enforced:** convention plus the `code-reviewer` agent (it walks logging discipline). To make "no bare `console.*`" mechanical, point the `banned-patterns` guard (`scripts/rules/40-banned-patterns.mjs`) at your application source. A copy-and-reskin reference logger that implements the whole standard (structured lines, correlation id, redaction, code anchor) lives in `examples/logger/`.

## Commenting standards

- **Top of every file:** copyright header (R12, locked by `scripts/rules/29-ip-headers.mjs`; `npm run headers:fix` repairs) + one or two sentences explaining what this module does and why it exists.
- **Function-level comments are WHY, not WHAT.** Well-named functions explain WHAT they do. Comments explain WHY a non-obvious choice was made (workaround for a library bug, link to an ADR, performance tradeoff).
- **Inline comments only for non-obvious gotchas.** Don't narrate code that's already clear. `// increment counter` adds nothing.
- **No "removed code" comments.** Git history is the record. Delete and move on.
- **No AI attribution in comments** (extends to comments): no `// (generated by ...)`, `// AI-assisted`, etc.
- **No paragraph-long docstrings.** One short line max. Detailed explanations belong in module-level CLAUDE.md or ADRs.
- **Banned-word list (the voice rules) applies to comments too** when they're going into shipping artifacts (UI copy, README, etc.). For internal source comments, the banned list is advisory; em dashes are still discouraged but not blocked.

## DEV-NOTES.md per module

- Each module folder has its own `DEV-NOTES.md`.
- Purpose: explain the stack and architectural decisions for a fresh developer with general web/mobile dev background but new to *this specific stack*.
- Living document: updated as the module evolves, not write-once. When you make a non-obvious change (chose one model over another for a stage; switched from polling to an event subscription; etc.), document the reasoning here.
- Referenced from the module's `CLAUDE.md` so AI assistants pick it up at session start.
- Format: prose + code snippets + diagrams when useful. Not a checklist; an explainer.

## Pre-commit machinery

This pre-commit discipline is machine-enforced via the project's git hooks:

```
.husky/commit-msg  ← blocks AI co-author trailers + em dashes in msg + non-Conventional subject
.husky/pre-commit  ← runs scripts/audit-rules.mjs + the test command
.husky/pre-push    ← warns on version drift + re-runs tests
```

`npm run audit:rules` is the bespoke checker (em dashes in user-facing files, banned words, AI co-author in recent commits, version drift). Run it manually any time:

```
npm run audit:rules
```

Adding a new rule? Pin a check in `scripts/audit-rules.mjs` so it can't drift away. Otherwise the rule is advisory and will be missed.

## Review-marker trigger map

The dev-workflow agents only help when actually invoked. The `commit-msg` hook enforces invocation by file-pattern lookup, mirroring how CI systems use `[skip ci]` markers. Greppable table; no judgment required.

> RESKIN: The patterns below are PLACEHOLDERS. Replace `<db-layer-glob>`,
> `<service-glob>`, etc. with this project's real paths, then encode the
> same table in `scripts/check-review-markers.mjs`. Keep the marker names
> stable so commit history stays auditable.

| Staged file pattern | Required marker | Agent to run |
|---|---|---|
| `<migrations-glob>` (e.g. `db/migrations/*.sql`) | `[db-reviewer-ok]` | `db-reviewer` |
| `<db-layer-glob>` (e.g. `src/db/**.js`, non-test) | `[db-reviewer-ok]` | `db-reviewer` |
| `<routes-glob>` (e.g. `src/routes/**.js`, non-test) | `[chain-tracer-ok]` | `chain-tracer` |
| `<service-glob>` (e.g. `src/services/**.js`, non-test) | `[chain-tracer-ok]` | `chain-tracer` |
| `<ui-glob>` AND `<backend-glob>` (same commit) | `[chain-tracer-ok]` | `chain-tracer` |

Marker format: `[marker-name]` or `[marker-name: verdict + date or justification]`. Case-insensitive. Anywhere in the commit message body. Pure self-attestation: run the agent, address every BLOCK/WARN, then add the marker so the commit can land. If an agent is legitimately not applicable (rare, single-file refactor with no behavior change), add the marker with a one-line justification so the skip is auditable.

**Why mechanical, not prose:** prose protocols ("remember to run chain-tracer") fail under fatigue; mechanical pattern-matching does not. Same insight that turned the no-em-dash / no-AI-coauthor / version-bump rules from advisory into enforced.

**`code-reviewer` is intentionally NOT in the trigger map.** Code-reviewer is a comprehensive walk across 10 dimensions and is expensive (Opus, several minutes). Real teams run that kind of review at milestone boundaries (end of sprint, before merge to main, before release), not every commit. Invoke it manually at those points; the requirements ledger tracks the "review-due" status per cluster.

## Dev-workflow agents (rationale)

The agent table itself lives in root `CLAUDE.md`. The longer-form notes are here.

**Model routing rationale:** the pre-commit hooks catch mechanical drift; agents catch semantic drift. The three highest-stakes agents (`chain-tracer`, `code-reviewer`, `db-reviewer`) run on Opus because they are the last line of defense against shipping a broken or insecure change (reliability over speed). `db-reviewer` earns Opus because mocked unit tests hide schema-type bugs (FK type mismatches, identifier-validation bugs) that only a real-database review catches. The other agents run on Sonnet because the work has semantic edges (supersession detection, prioritization, equivalent-but-different markup) that a smaller model occasionally fumbles. None default to Opus, to preserve the main session's Opus rate-limit pool. This applies cheap-first model routing to the dev workflow itself.

**Why these seven specifically:** each maps to a real failure mode (mockup drift, missing cross-layer chain trace, dropped instructions, undisciplined commits, stale handoff, schema-type bugs that mocked tests hide, and "someone had to remember to run the suite").

**Telemetry (opt-in).** After a sub-agent run, the main session can append one JSONL line via `scripts/log-agent-invocation.mjs` (schema + read-back recipes in `docs/agent-telemetry.md`). Non-blocking; the data is what lets you tune the R5 trigger map instead of guessing. The log is gitignored per-fork runtime data.

**Pre-commit read order:** run through the commit checklist mentally. If a box can't be ticked, stop and surface to NextScrum.
