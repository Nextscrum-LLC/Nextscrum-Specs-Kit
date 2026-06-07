---
description: Security + performance + license audit. Run before any release-shaped milestone (before merge to main).
---
<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->


Three audit passes. Print findings grouped by severity.

> RESKIN: Adjust the source globs (`backend/src/`, `client/`, etc.) to this
> project's directory layout, and adjust the secret-key regex to match the
> providers this project actually uses. The `npm run ...` scripts referenced
> below are project-supplied; wire them in your `package.json` or adapt the step.
> Drop any check that does not apply.

## 1. Security audit

- **Secrets in code** - grep the source tree for provider key patterns (for example `sk-[a-zA-Z0-9]{10,}`, cloud access keys, JWT secrets). Must return 0 hits.
- **Hardcoded credentials** - search for `password`, `apikey`, `token`, `secret` as string literal values (not JSON keys, not env-var reads). Flag any.
- **SQL injection patterns** - flag any string concatenation into SQL; we use parameterized queries everywhere.
- **Unsafe HTML** - flag any `innerHTML =`, `eval(`, `new Function(`, `dangerouslySetInnerHTML`. None of these should appear.
- **Logger PII risk** - flag any `logger.info(req)` or `logger.info(payload)` without redaction. Should use a structured `logger.info({ id, stage }, 'msg')` shape.
- **`.env` in git** - `git ls-files | grep -E '\.env(\..*)?$'` must be empty.
- **Service-account / credential JSON in git** - `git ls-files | grep -E 'service-account.*\.json|credentials.*\.json'` must be empty.
- Cross-reference against the project's security doc "Where secrets MUST NOT appear" section.

## 2. Performance audit

- **A processing stage that blocks on a non-async call** - flag any sync `crypto`, `fs`, or DB driver call inside an async function.
- **N+1 queries** - flag any loop that calls `query()` inside a `for`/`map`/`forEach`. Should batch into a single query.
- **Unbounded fetches** - flag any `SELECT * FROM <large_table>` without `LIMIT`.
- **In-memory caches without eviction** - flag any module-level `Map` or `Set` that's `set` but never bounded. Should be LRU or removed.
- **Sequential awaits that could be parallel** - flag `await x; await y;` where x and y don't depend on each other; suggest `Promise.all`.
- **Excessive token usage** (if the product calls an LLM) - flag any prompt that fires more than once per run; consider prompt caching.

## 3. IP & dependency audit

- **IP headers** - `npm run headers:check` (same as `/qa` step 1; included here for completeness).
- **License of new dependencies** - for any `dependencies` or `devDependencies` added since the last audit, run `npx license-checker --summary`. Flag any GPL/AGPL: a permissive Apache-2.0 project should avoid copyleft dependencies that would impose their terms on redistribution.
- **`LICENSE` file present at repo root** - fail if missing.
- **Third-party LICENSE notices preserved** - if we vendored any code (we shouldn't), check the original LICENSE travels with it.

## Output

Group findings:

```
## Critical (block release)
- ...

## High (fix before merge)
- ...

## Medium (track in HANDOFF)
- ...

## Info / passing checks
- ...
```

If anything in Critical: refuse to mark the audit clean; tell the user what to fix.
