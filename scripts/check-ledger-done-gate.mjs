#!/usr/bin/env node
// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/check-ledger-done-gate.mjs
//
// Mechanical enforcement of the done-gate. Parses
// docs/requirements.md and refuses to let the commit land if any
// entry marked `done` has a `Verified by` field below
// `NextScrum-manual`.
//
// Why: "I marked it done, NextScrum found a bug" is a recurring failure
// mode. Tests-pass and review-clean are necessary but not sufficient.
// Until NextScrum drove the user-facing behavior, the entry is
// in-review, not done.
//
// Verification levels (ranked):
//   tests-only           < unit + structural tests pass; no review ran
//   agent-chain-trace    < a chain trace verified the wiring
//   NextScrum-manual     >= NextScrum drove the user-facing behavior and confirmed
//   production-smoke     >= post-deploy smoke run
//
// Done gate: status === "done"  =>  verified_by >= NextScrum-manual
//
// One special token:
//   "n/a"  items where NextScrum-manual genuinely does not apply
//          (pure-docs commits, internal tooling not driven by a human).
//          Requires an explicit one-line justification.
//
// Usage:
//   node scripts/check-ledger-done-gate.mjs
//   node scripts/check-ledger-done-gate.mjs --self-test
//
// Exit codes:
//   0 = ledger clean (all `done` entries verified appropriately)
//   1 = gate failure; commit blocked
//   2 = usage error
//   3 = self-test failure

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
// RESKIN: point this at your ledger file if it lives elsewhere.
const LEDGER_PATH = resolve(ROOT, "docs", "requirements.md");

// Ordered weakest -> strongest.
const VERIFY_LEVELS = [
  "tests-only",
  "agent-chain-trace",
  "NextScrum-manual",
  "production-smoke",
];
const VERIFY_INDEX = Object.fromEntries(VERIFY_LEVELS.map((v, i) => [v, i]));
const MIN_LEVEL_FOR_DONE = VERIFY_INDEX["NextScrum-manual"];

// Special token.
const SPECIAL_NA = "n/a";

/**
 * Parse the ledger into a flat array of {id, status, verifiedBy, body}.
 * Robust to whitespace + bullet variation. Returns only well-formed
 * SPEC-NNN entries; ignores section headers, free prose, the index.
 */
export function parseLedger(markdown) {
  const entries = [];
  // Split by entry header: ### SPEC-NNN (date) - title
  const sections = markdown.split(/^### (SPEC-\d+)\b/m);
  // sections[0] is the prelude before any entry; entries follow as
  // pairs [id, body, id, body, ...].
  for (let i = 1; i < sections.length; i += 2) {
    const id = sections[i];
    const body = sections[i + 1] || "";
    const status = matchBulletField(body, "Status");
    const verifiedBy = matchBulletField(body, "Verified by");
    entries.push({ id, status, verifiedBy, body });
  }
  return entries;
}

/**
 * Match a bullet field like `- **Status:** done` and return the value
 * (trimmed). Handles trailing notes after the value by taking only
 * the first token before any ` (` or ` ;`.
 */
function matchBulletField(body, fieldName) {
  const re = new RegExp(`^\\s*-\\s*\\*\\*${fieldName}:\\*\\*\\s*([^\\n]+)$`, "im");
  const m = body.match(re);
  if (!m) return null;
  // Take the value before any " (" or " ;" so notes after the value
  // don't pollute the token.
  return m[1].split(/\s+\(|\s+;/)[0].trim();
}

/**
 * Apply the gate. Returns { ok: boolean, failures: [...] }.
 */
export function checkLedger(entries) {
  const failures = [];
  for (const e of entries) {
    if (e.status !== "done") continue; // gate applies only to `done`
    if (!e.verifiedBy) {
      failures.push({ id: e.id, reason: "missing Verified by field" });
      continue;
    }
    if (e.verifiedBy === SPECIAL_NA) {
      // The special token is allowed but only if accompanied by an inline
      // justification. We look for a parenthetical note OR a `; note`
      // suffix on the original line.
      const inline = bulletFieldFull(e.body, "Verified by");
      if (!/(\(|;\s+)\S/.test(inline)) {
        failures.push({
          id: e.id,
          reason: `Verified by '${e.verifiedBy}' requires an inline justification (e.g., "${e.verifiedBy}; reason here")`,
        });
      }
      continue;
    }
    const idx = VERIFY_INDEX[e.verifiedBy];
    if (idx === undefined) {
      failures.push({
        id: e.id,
        reason: `unknown Verified by value '${e.verifiedBy}'. Expected one of: ${VERIFY_LEVELS.join(", ")}, ${SPECIAL_NA}`,
      });
      continue;
    }
    if (idx < MIN_LEVEL_FOR_DONE) {
      failures.push({
        id: e.id,
        reason: `status is 'done' but Verified by is '${e.verifiedBy}' (need at least 'NextScrum-manual'). Demote status to 'in-review' until NextScrum manual-verifies.`,
      });
    }
  }
  return { ok: failures.length === 0, failures };
}

function bulletFieldFull(body, fieldName) {
  const re = new RegExp(`^\\s*-\\s*\\*\\*${fieldName}:\\*\\*\\s*([^\\n]+)$`, "im");
  const m = body.match(re);
  return m ? m[1].trim() : "";
}

// ---------- CLI ----------

function main(args) {
  if (args.includes("--self-test")) return runSelfTest();

  if (!existsSync(LEDGER_PATH)) {
    process.stderr.write(`ledger not found at ${LEDGER_PATH}\n`);
    process.exit(2);
  }

  const md = readFileSync(LEDGER_PATH, "utf8");
  const entries = parseLedger(md);
  const result = checkLedger(entries);

  const doneCount = entries.filter((e) => e.status === "done").length;
  if (result.ok) {
    process.stdout.write(`ok  R6 done-gate: ledger done-gate clean (${doneCount} done entries verified)\n`);
    process.exit(0);
  }

  process.stderr.write("\nx  R6 done-gate: ledger done-gate failure.\n\n");
  for (const f of result.failures) {
    process.stderr.write(`  ${f.id}: ${f.reason}\n`);
  }
  process.stderr.write("\nFix:\n");
  process.stderr.write("  1. For items NextScrum has NOT manually verified yet, demote status from 'done' to 'in-review'.\n");
  process.stderr.write("  2. Add the 'Verified by' field with the actual level achieved.\n");
  process.stderr.write("  3. Once NextScrum manual-verifies, promote to 'done' + stamp 'Verified by: NextScrum-manual (YYYY-MM-DD)'.\n");
  process.stderr.write("  4. For pure-docs or internal items not human-driven, use 'Verified by: n/a; justification here'.\n\n");
  process.exit(1);
}

// ---------- Self-test ----------

function runSelfTest() {
  let pass = 0;
  let fail = 0;
  function expect(name, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) {
      pass++;
      process.stdout.write(`  ok ${name}\n`);
    } else {
      fail++;
      process.stdout.write(`  x ${name}\n`);
      process.stdout.write(`     expected: ${JSON.stringify(expected)}\n`);
      process.stdout.write(`     actual:   ${JSON.stringify(actual)}\n`);
    }
  }

  process.stdout.write("scripts/check-ledger-done-gate.mjs self-test\n");

  // Parse
  const sample = `# Header
ignored prose

### SPEC-001 (2026-05-17) - Foo
- **Status:** done
- **Verified by:** NextScrum-manual (2026-05-26)

### SPEC-002 (2026-05-17) - Bar
- **Status:** done
- **Verified by:** tests-only

### SPEC-003 (2026-05-17) - Baz
- **Status:** in-review
- **Verified by:** agent-chain-trace

### SPEC-004 (2026-05-17) - Open item
- **Status:** open

### SPEC-005 (2026-05-17) - Docs item
- **Status:** done
- **Verified by:** n/a (pure docs commit, not human-driven)
`;

  const entries = parseLedger(sample);
  expect("parses 5 entries", entries.map((e) => e.id), ["SPEC-001", "SPEC-002", "SPEC-003", "SPEC-004", "SPEC-005"]);
  expect("SPEC-001 done + NextScrum-manual", { s: entries[0].status, v: entries[0].verifiedBy }, { s: "done", v: "NextScrum-manual" });
  expect("SPEC-002 done + tests-only", { s: entries[1].status, v: entries[1].verifiedBy }, { s: "done", v: "tests-only" });
  expect("SPEC-004 open + no verifiedBy", { s: entries[3].status, v: entries[3].verifiedBy }, { s: "open", v: null });
  expect("SPEC-005 done + n/a justified", { s: entries[4].status, v: entries[4].verifiedBy }, { s: "done", v: "n/a" });

  // Gate
  const result = checkLedger(entries);
  expect("gate fails (SPEC-002 tests-only as done)", result.ok, false);
  expect("gate flags SPEC-002 only", result.failures.map((f) => f.id), ["SPEC-002"]);

  // Strict block on missing verified_by for done
  const missingVerify = parseLedger(`### SPEC-010 (2026-05-17) - Missing field
- **Status:** done
`);
  expect("missing Verified by on done is a failure", checkLedger(missingVerify).failures.length, 1);

  // Unknown level
  const unknownLevel = parseLedger(`### SPEC-020 (2026-05-17) - Unknown level
- **Status:** done
- **Verified by:** maybe-verified
`);
  const unknownResult = checkLedger(unknownLevel);
  expect("unknown level rejected", unknownResult.failures[0].reason.includes("unknown"), true);

  // n/a token requires justification
  const naNoJust = parseLedger(`### SPEC-030 (2026-01-01) - n/a no just
- **Status:** done
- **Verified by:** n/a
`);
  expect("n/a without justification fails", checkLedger(naNoJust).failures.length, 1);

  const naWithJust = parseLedger(`### SPEC-031 (2026-01-01) - n/a with just
- **Status:** done
- **Verified by:** n/a (pure docs commit; not human-driven)
`);
  expect("n/a with justification passes", checkLedger(naWithJust).ok, true);

  // production-smoke also passes the gate
  const prodSmoke = parseLedger(`### SPEC-040 (2026-05-17) - Production-smoke
- **Status:** done
- **Verified by:** production-smoke (live deploy 2026-05-26)
`);
  expect("production-smoke passes gate", checkLedger(prodSmoke).ok, true);

  // status not done is never gated
  const inProgressDoneFree = parseLedger(`### SPEC-050 (2026-05-17) - In progress
- **Status:** in-progress
`);
  expect("in-progress without verified_by is fine", checkLedger(inProgressDoneFree).ok, true);

  process.stdout.write(`\nself-test: ${pass} passed, ${fail} failed\n`);
  if (fail > 0) process.exit(3);
  process.exit(0);
}

const isMain = process.argv[1]?.endsWith("check-ledger-done-gate.mjs");
if (isMain) main(process.argv.slice(2));
