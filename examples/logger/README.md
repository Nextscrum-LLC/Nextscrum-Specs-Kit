<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# Reference logger (R13 observability)

> A **reference implementation**, not stack-neutral kit code. It is a small,
> dependency-free Node logger that shows the shape the R13 observability standard
> asks for. Copy it into your project and reskin it, or swap in your platform's
> logger (pino, winston, a cloud SDK) while keeping the same shape. Delete
> `examples/` once your real logger is in place.

## What it demonstrates

`logger.mjs` is deliberately tiny so the standard is visible, not buried in a
library. It shows the four things R13 requires:

1. **Structured, one event per line.** Every call writes a single JSON object.
   Humans grep it; tools and AI agents parse it. No free-form string logs.
2. **A correlation id threaded through a unit of work.** `withContext(id, fn)`
   puts an id in `AsyncLocalStorage`; every line emitted inside inherits it, so
   one request's whole path is reconstructable by grepping a single id. You
   generate the id at the boundary (HTTP middleware, the queue consumer).
3. **Redaction of secrets and PII.** `REDACT_KEYS` masks sensitive fields
   (passwords, tokens, emails, and so on) before anything reaches a sink, at any
   nesting depth.
4. **An error event with a code anchor.** `logError(err, { op, code, spec })`
   records the error plus where it came from (`code: "module:function"`) and the
   spec it implements (`spec: "SPEC-001"`). That anchor is the AI-debuggable
   part: an agent reading a production log line can jump straight to the spec,
   plan, tests, and code without guessing.

## Try it

```bash
node examples/logger/logger.mjs --self-test   # the assertions
node examples/logger/logger.mjs               # a one-request demo
```

The demo prints a received-request line and an error line that share a `corrId`
and carry a `code` + `spec` anchor, with a secret in the input masked.

## Adopting it

- Copy `logger.mjs` to your source tree (for example `src/lib/log.mjs`) and make
  it your one logging entry point. The "one source of truth per concept" rule in
  `engineering.md` applies: do not scatter `console.*` across the code.
- Generate a correlation id at every entry point and wrap the work in
  `withContext`. Pass the same id to downstream services so the trace spans them.
- Extend `REDACT_KEYS` for your domain's sensitive fields.
- Route persistent failures into the error queue (`docs/error-queue.md`, surfaced
  by `/checkqueue`) so there is one place to triage.

## Locking it for your project

R13 is a convention plus the `code-reviewer` agent. To make "no bare `console.*`
in app code" mechanical, point the `banned-patterns` configurable guard
(`scripts/rules/40-banned-patterns.mjs`) at your app source with a pattern for
`console.log` / `console.error`, with an auditable per-line opt-out for the few
legitimate CLI cases. See [docs/rules/README.md](../../docs/rules/README.md).
