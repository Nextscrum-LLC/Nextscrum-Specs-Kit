// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// examples/logger/logger.mjs
//
// REFERENCE IMPLEMENTATION, not stack-neutral kit code. A dependency-free Node
// logger that demonstrates the R13 observability standard so a fork has a
// concrete starting point. Copy it into your project and reskin it (or swap in
// pino / winston / your platform's logger) while KEEPING THE SHAPE:
//
//   1. structured JSON, one event per line (greppable by humans, parseable by
//      tools and AI agents);
//   2. a correlation id threaded through a unit of work, so one request's whole
//      path can be reconstructed by grepping a single id;
//   3. secrets / PII redacted before anything reaches a sink;
//   4. an error event that carries a "code anchor" (module:function) and, when
//      known, the SPEC-NNN it implements, so a developer OR an agent can jump
//      from a log line straight to the spec, plan, tests, and code.
//
// Run the self-test / demo:  node examples/logger/logger.mjs --self-test

import { AsyncLocalStorage } from "node:async_hooks";

export const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
// RESKIN: set LOG_LEVEL=info (or warn) in production to drop debug noise.
const MIN_LEVEL = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.debug;

// Correlation context. Every log line emitted inside withContext() inherits the
// same corrId without it being passed by hand, which is what makes a request's
// path reconstructable from a grep. AsyncLocalStorage is a Node built-in.
const als = new AsyncLocalStorage();

// RESKIN: keys whose values are masked before they can reach a log sink. Add
// every field name your domain treats as a secret or as personal data.
export const REDACT_KEYS = new Set([
  "password", "pass", "token", "authorization", "auth", "cookie",
  "secret", "apikey", "api_key", "ssn", "email", "phone",
]);

/** Deep-copy a value with any secret/PII key masked. Bounded depth so a cyclic
 * or huge object cannot stall the logger. */
export function redact(value, depth = 0) {
  if (depth > 5 || value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = REDACT_KEYS.has(k.toLowerCase()) ? "[redacted]" : redact(v, depth + 1);
  }
  return out;
}

/** Turn an Error into a loggable object (message + stack), never a bare string,
 * so the stack survives into the structured event. */
export function serializeError(err) {
  if (!(err instanceof Error)) return err;
  const out = { name: err.name, message: err.message, stack: err.stack };
  if (err.code !== undefined) out.code = err.code;
  return out;
}

function emit(level, msg, fields, sink) {
  if (LEVELS[level] < MIN_LEVEL) return null;
  const ctx = als.getStore() || {};
  const event = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(ctx.corrId ? { corrId: ctx.corrId } : {}),
    ...redact(fields || {}),
  };
  const target = sink || (LEVELS[level] >= LEVELS.warn ? process.stderr : process.stdout);
  target.write(JSON.stringify(event) + "\n");
  return event;
}

/**
 * Create a logger. `base` fields are merged into every line (e.g. { svc: "api" }).
 * `sink` is any object with a write(string) method; defaults to stdout/stderr.
 */
export function createLogger(base = {}, sink) {
  const at = (level) => (msg, fields) => emit(level, msg, { ...base, ...fields }, sink);
  return {
    debug: at("debug"),
    info: at("info"),
    warn: at("warn"),
    error: at("error"),
    // The error helper is the load-bearing one. Pass the error plus a code
    // anchor (`code: "module:function"`) and, when you have it, the spec it
    // implements (`spec: "SPEC-001"`). That anchor is what lets an agent move
    // from a production log line to the exact code and its spec.
    logError(err, { op, code, spec, ...rest } = {}) {
      return emit(
        "error",
        err && err.message ? err.message : "error",
        { ...base, op, code, spec, err: serializeError(err), ...rest },
        sink,
      );
    },
  };
}

/** Run a unit of work (an HTTP request, a queue job) under a correlation id so
 * every log line inside carries it. Generate the id at the boundary. */
export function withContext(corrId, fn) {
  return als.run({ corrId }, fn);
}

// ---------- self-test / demo ----------

function runSelfTest() {
  let pass = 0,
    failc = 0;
  const expect = (name, actual, expected) => {
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
      pass++;
      process.stdout.write(`  ok ${name}\n`);
    } else {
      failc++;
      process.stdout.write(`  x ${name}\n     expected ${JSON.stringify(expected)} got ${JSON.stringify(actual)}\n`);
    }
  };

  process.stdout.write("examples/logger/logger.mjs self-test\n");

  // Redaction, including nested.
  expect(
    "redact masks secret keys (nested)",
    redact({ password: "x", a: { token: "y", b: 1 } }),
    { password: "[redacted]", a: { token: "[redacted]", b: 1 } },
  );

  // Error serialization keeps message + a stack.
  const se = serializeError(new Error("boom"));
  expect("serializeError keeps message", se.message, "boom");
  expect("serializeError keeps a stack", typeof se.stack === "string" && se.stack.length > 0, true);

  // Correlation id is threaded through, and a logged object is redacted.
  const lines = [];
  const sink = { write: (s) => lines.push(s) };
  const log = createLogger({ svc: "test" }, sink);
  withContext("corr-123", () => log.info("served", { user: { token: "t" } }));
  const ev = JSON.parse(lines[0]);
  expect("line carries corrId from context", ev.corrId, "corr-123");
  expect("line carries base fields", ev.svc, "test");
  expect("nested secret redacted on the line", ev.user.token, "[redacted]");

  // logError carries the code anchor + spec for jump-to-source.
  const lines2 = [];
  const log2 = createLogger({}, { write: (s) => lines2.push(s) });
  log2.logError(new Error("db down"), { op: "saveTicket", code: "services/tickets:save", spec: "SPEC-001" });
  const ev2 = JSON.parse(lines2[0]);
  expect("error event has code anchor", ev2.code, "services/tickets:save");
  expect("error event has spec anchor", ev2.spec, "SPEC-001");
  expect("error event serializes the error", ev2.err.message, "db down");

  process.stdout.write(`\nself-test: ${pass} passed, ${failc} failed\n`);
  process.exit(failc > 0 ? 3 : 0);
}

const isMain = process.argv[1]?.endsWith("logger.mjs");
if (isMain && process.argv.includes("--self-test")) {
  runSelfTest();
} else if (isMain) {
  // Demo: show what a request's worth of structured lines looks like.
  const log = createLogger({ svc: "demo-api" });
  withContext("req-7f3a", () => {
    log.info("request received", { route: "POST /tickets" });
    log.logError(new Error("connection refused"), {
      op: "saveTicket",
      code: "services/tickets:save",
      spec: "SPEC-001",
      input: { subject: "Need help", apikey: "sk-should-be-hidden" },
    });
  });
}
