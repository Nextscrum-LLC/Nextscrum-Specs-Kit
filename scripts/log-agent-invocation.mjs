// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/log-agent-invocation.mjs
//
// Append-only JSONL writer for dev-workflow-agent invocation telemetry. One
// line per invocation, written to docs/agent-telemetry.jsonl. Used to reason
// about how often each agent fires, what verdicts dominate, and whether the
// review-marker trigger map (R5) is well-calibrated.
//
// Why this exists: the dev-workflow agents are invoked manually (per the R5
// trigger map in engineering.md). Without a record of WHEN each agent ran and
// WHAT it found, you cannot tune the trigger map or justify an agent's cost.
// This makes invocations auditable. Opt-in: nothing logs until the main session
// calls it after an agent run. Schema and query recipes: docs/agent-telemetry.md.
//
// Usage (CLI):
//   node scripts/log-agent-invocation.mjs \
//     --agent chain-tracer --verdict PASS --duration-ms 12000 \
//     --commit staged --context "SPEC-001 export route" --notes "8 hops traced"
//
// Usage (programmatic):
//   import { appendInvocation } from "./log-agent-invocation.mjs";
//   appendInvocation({ agent, verdict, duration_ms, commit, context, notes });
//
// Self-test: node scripts/log-agent-invocation.mjs --self-test

import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const LOG_PATH = resolve(ROOT, "docs", "agent-telemetry.jsonl");

// The kit's seven dev-workflow agents. RESKIN: add or drop to match your set.
const VALID_AGENTS = new Set([
  "chain-tracer",
  "code-reviewer",
  "db-reviewer",
  "requirements-ledger",
  "handoff-writer",
  "mockup-checker",
  "playwright-runner",
]);

/**
 * Validate an invocation object. Returns { ok, error } rather than throwing so
 * a telemetry failure never cascades into the calling commit.
 */
export function validateInvocation(obj) {
  if (!obj || typeof obj !== "object") return { ok: false, error: "object required" };
  if (typeof obj.agent !== "string" || !VALID_AGENTS.has(obj.agent)) {
    return { ok: false, error: `agent must be one of: ${[...VALID_AGENTS].join(", ")}` };
  }
  if (typeof obj.verdict !== "string" || obj.verdict.length === 0 || obj.verdict.length > 80) {
    return { ok: false, error: "verdict must be a non-empty string up to 80 chars" };
  }
  if (typeof obj.duration_ms !== "number" || obj.duration_ms < 0 || !Number.isFinite(obj.duration_ms)) {
    return { ok: false, error: "duration_ms must be a non-negative number" };
  }
  if (typeof obj.commit !== "string" || obj.commit.length === 0) {
    return { ok: false, error: "commit must be a non-empty string (short SHA or 'staged')" };
  }
  if (typeof obj.context !== "string" || obj.context.length === 0 || obj.context.length > 200) {
    return { ok: false, error: "context must be a non-empty string up to 200 chars" };
  }
  if (obj.notes !== undefined && (typeof obj.notes !== "string" || obj.notes.length > 800)) {
    return { ok: false, error: "notes must be a string up to 800 chars (optional)" };
  }
  return { ok: true };
}

/**
 * Append one JSONL line. Returns the full event on success. Auto-stamps ts
 * (ISO UTC) when not provided.
 */
export function appendInvocation(partial, opts = {}) {
  const path = opts.path || LOG_PATH;
  const event = {
    ts: partial.ts || new Date().toISOString(),
    agent: partial.agent,
    verdict: partial.verdict,
    duration_ms: partial.duration_ms,
    commit: partial.commit,
    context: partial.context,
  };
  if (partial.notes !== undefined) event.notes = partial.notes;
  const v = validateInvocation(event);
  if (!v.ok) throw new Error(`invalid invocation: ${v.error}`);
  appendFileSync(path, JSON.stringify(event) + "\n", "utf8");
  return event;
}

/** Parse CLI args into a partial invocation object. */
export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const val = argv[i + 1];
    if (!val || val.startsWith("--")) continue;
    i++; // consume value
    if (key === "duration-ms") out.duration_ms = Number(val);
    else out[key.replace(/-/g, "_")] = val;
  }
  return out;
}

function main(args) {
  if (args.includes("--self-test")) return runSelfTest();

  if (args.length === 0 || args.includes("--help")) {
    process.stderr.write(
      "usage: log-agent-invocation.mjs --agent <name> --verdict <token> " +
        "--duration-ms <n> --commit <sha-or-staged> --context <label> [--notes <text>]\n",
    );
    process.exit(2);
  }

  try {
    const event = appendInvocation(parseArgs(args));
    process.stdout.write(`ok  telemetry: logged ${event.agent} -> ${event.verdict} (${event.duration_ms}ms) for ${event.context}\n`);
    process.exit(0);
  } catch (e) {
    process.stderr.write(`telemetry write failed: ${e.message}\n`);
    process.exit(1);
  }
}

// ---------- Self-test ----------

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

  process.stdout.write("scripts/log-agent-invocation.mjs self-test\n");

  expect("missing agent fails", validateInvocation({ verdict: "PASS", duration_ms: 10, commit: "abc", context: "x" }).ok, false);
  expect("unknown agent fails", validateInvocation({ agent: "rogue", verdict: "PASS", duration_ms: 10, commit: "abc", context: "x" }).ok, false);
  expect("negative duration fails", validateInvocation({ agent: "chain-tracer", verdict: "PASS", duration_ms: -1, commit: "abc", context: "x" }).ok, false);
  expect("empty verdict fails", validateInvocation({ agent: "chain-tracer", verdict: "", duration_ms: 1, commit: "abc", context: "x" }).ok, false);
  expect("verdict over-length fails", validateInvocation({ agent: "chain-tracer", verdict: "x".repeat(81), duration_ms: 1, commit: "abc", context: "x" }).ok, false);
  expect("notes over-length fails", validateInvocation({ agent: "chain-tracer", verdict: "PASS", duration_ms: 1, commit: "abc", context: "x", notes: "x".repeat(801) }).ok, false);
  expect("all valid passes", validateInvocation({ agent: "chain-tracer", verdict: "PASS", duration_ms: 1, commit: "abc", context: "x" }).ok, true);
  expect(
    "parseArgs handles all fields",
    parseArgs(["--agent", "chain-tracer", "--verdict", "PASS", "--duration-ms", "1234", "--commit", "abc", "--context", "Phase X", "--notes", "n"]),
    { agent: "chain-tracer", verdict: "PASS", duration_ms: 1234, commit: "abc", context: "Phase X", notes: "n" },
  );

  // Round-trip append to a temp file.
  const tmp = resolve(__dirname, ".self-test-telemetry.jsonl");
  try {
    writeFileSync(tmp, "", "utf8");
    const event = appendInvocation({ agent: "code-reviewer", verdict: "PASS", duration_ms: 100, commit: "abc", context: "self-test" }, { path: tmp });
    expect("event ts auto-stamped", typeof event.ts === "string" && event.ts.length > 0, true);
    expect("appended line parses back", JSON.parse(readFileSync(tmp, "utf8").trim()).agent, "code-reviewer");
    if (existsSync(tmp)) writeFileSync(tmp, "", "utf8");
  } catch (e) {
    failc++;
    process.stdout.write(`  x append round-trip threw: ${e.message}\n`);
  }

  process.stdout.write(`\nself-test: ${pass} passed, ${failc} failed\n`);
  process.exit(failc > 0 ? 3 : 0);
}

const isMain = process.argv[1]?.endsWith("log-agent-invocation.mjs");
if (isMain) main(process.argv.slice(2));
