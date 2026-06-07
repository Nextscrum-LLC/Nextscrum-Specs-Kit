#!/usr/bin/env node
// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/check-review-markers.mjs
//
// Mechanical enforcement of the review-marker requirement.
// Maps staged-file patterns to required review markers in the commit
// message. Refuses the commit if a required marker is missing.
//
// Why: specialist review steps (a DB review, a cross-layer trace, a
// security pass) catch a class of bugs that fast unit tests can't see.
// Those steps are only useful when actually performed. Husky-side
// enforcement converts "remember to do the review" from a judgment
// call into a mechanical gate, mirroring how production teams use CI:
// fast checks every commit, specialist reviews triggered by
// file-pattern match.
//
// Markers are self-attestation: the developer adds them to the commit
// message after performing the corresponding review. This is not a
// verification hook; it is a forcing function that makes the review
// step explicit and removes the "I forgot" failure mode. Same pattern
// as how teams use `[skip ci]` or `[no-deploy]` markers.
//
// RESKIN: the RULES trigger map below uses placeholder globs. Replace
// the `match` regexes (and markers, if you rename your review steps)
// to point at the file patterns that, in YOUR project, demand a
// specialist review. The self-test patterns mirror these placeholders;
// update both together so the self-test stays green.
//
// Usage:
//   node scripts/check-review-markers.mjs <path-to-commit-msg-file>
//   node scripts/check-review-markers.mjs --self-test
//
// Exit codes:
//   0 = clean (all required markers present, or none required)
//   1 = missing marker; commit blocked
//   2 = usage error
//   3 = self-test failure

import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

// ---------- Trigger map ----------
//
// Each rule has:
//   match: function (filename, allStagedFiles) -> boolean
//   marker: string token expected in commit message body
//   reason: human-readable explanation included in the failure message
//
// Order matters only for failure-message clarity; rules are AND-combined
// (any matched rule's marker must be present).
//
// RESKIN: every regex and marker below is an EXAMPLE. Tune to your repo.

const RULES = [
  {
    // RESKIN: set this to your migration files glob, e.g. <DB>/migrations/*.sql
    id: "DB_REVIEWER_MIGRATIONS",
    match: (f) => /^(?:[^/]+\/)*migrations\/.+\.sql$/.test(f),
    marker: "db-reviewer-ok",
    reason: "migration file changed; run the DB review (foreign-key alignment, indexes, idempotency, migration-safety).",
  },
  {
    // RESKIN: set this to your data-access layer glob, e.g. <PROJECT_SRC_GLOB>/db/**.js
    id: "DB_REVIEWER_DB_LAYER",
    match: (f) => /(?:^|\/)db\/(?!.*\.test\.[cm]?js$).+\.[cm]?js$/.test(f),
    marker: "db-reviewer-ok",
    reason: "data-access-layer source changed (client / schema / migrate runner); run the DB review.",
  },
  {
    // RESKIN: set this to your backend route glob, e.g. <PROJECT_SRC_GLOB>/routes/**.js
    id: "CHAIN_TRACER_ROUTES",
    match: (f) => /(?:^|\/)routes\/(?!.*\.test\.[cm]?js$).+\.[cm]?js$/.test(f),
    marker: "chain-tracer-ok",
    reason: "route file changed; trace UI -> route -> data layer -> response -> render.",
  },
  {
    // RESKIN: set this to your service-layer glob, e.g. <PROJECT_SRC_GLOB>/services/**.js
    id: "CHAIN_TRACER_SERVICES",
    match: (f) => /(?:^|\/)services\/(?!.*\.test\.[cm]?js$).+\.[cm]?js$/.test(f),
    marker: "chain-tracer-ok",
    reason: "service file changed; verify call sites + downstream consumers.",
  },
  {
    // RESKIN: cross-layer rule. Fires when a UI file and a backend
    // source file change in the same commit. Replace <UI_GLOB> and
    // <PROJECT_SRC_GLOB> with your real directory prefixes.
    id: "CHAIN_TRACER_CROSS_LAYER",
    match: (f, all) =>
      /^(?:ui|frontend|client)\//.test(f) &&
      all.some((other) => /^(?:src|backend|server)\//.test(other)),
    marker: "chain-tracer-ok",
    reason: "UI + backend changed together (cross-layer); verify the round-trip.",
  },
];

// ---------- Helpers ----------

function getStagedFiles() {
  try {
    const out = execSync("git diff --cached --name-only", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Compute the set of required markers given a list of staged files.
 * Returns a Map<marker, {ruleIds, reasons, files}> for human-friendly errors.
 */
export function computeRequiredMarkers(stagedFiles) {
  const required = new Map();
  for (const f of stagedFiles) {
    for (const rule of RULES) {
      if (rule.match(f, stagedFiles)) {
        const existing = required.get(rule.marker) || { ruleIds: new Set(), reasons: new Set(), files: new Set() };
        existing.ruleIds.add(rule.id);
        existing.reasons.add(rule.reason);
        existing.files.add(f);
        required.set(rule.marker, existing);
      }
    }
  }
  return required;
}

/**
 * Look for a marker like `[chain-tracer-ok]` or `[chain-tracer-ok: anything]`
 * anywhere in the commit message. Bracketed form keeps the marker visible
 * in `git log --oneline` without polluting prose.
 */
export function commitMessageHasMarker(msg, marker) {
  if (typeof msg !== "string" || typeof marker !== "string") return false;
  const re = new RegExp(`\\[\\s*${marker.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}(?::[^\\]]*)?\\s*\\]`, "i");
  return re.test(msg);
}

// ---------- Main / CLI ----------

function main(args) {
  if (args.includes("--self-test")) {
    return runSelfTest();
  }

  const msgFile = args[0];
  if (!msgFile) {
    process.stderr.write("usage: check-review-markers.mjs <commit-msg-file> | --self-test\n");
    process.exit(2);
  }
  if (!existsSync(msgFile)) {
    process.stderr.write(`commit message file not found: ${msgFile}\n`);
    process.exit(2);
  }

  const staged = getStagedFiles();
  if (staged.length === 0) {
    // Nothing staged. Either an empty commit or a merge; let other hooks decide.
    process.exit(0);
  }
  const msg = readFileSync(msgFile, "utf8");
  const required = computeRequiredMarkers(staged);

  const missing = [];
  for (const [marker, info] of required.entries()) {
    if (!commitMessageHasMarker(msg, marker)) {
      missing.push({ marker, ...info });
    }
  }

  if (missing.length === 0) {
    if (required.size > 0) {
      const okList = [...required.keys()].map((m) => `[${m}]`).join(", ");
      process.stdout.write(`ok  R5 review-markers: review markers present (${okList})\n`);
    }
    process.exit(0);
  }

  // Failure: print a clear, actionable message.
  process.stderr.write("\nx  commit-msg blocked: required review markers missing (R5 review-markers).\n\n");
  for (const m of missing) {
    process.stderr.write(`  Missing marker: [${m.marker}]\n`);
    process.stderr.write(`    Triggered by: ${[...m.files].slice(0, 3).join(", ")}${m.files.size > 3 ? ` (and ${m.files.size - 3} more)` : ""}\n`);
    for (const reason of m.reasons) {
      process.stderr.write(`    Why:          ${reason}\n`);
    }
    process.stderr.write("\n");
  }
  process.stderr.write("Fix:\n");
  process.stderr.write("  1. Perform the corresponding review step\n");
  process.stderr.write("  2. Address every issue it surfaces\n");
  process.stderr.write("  3. Append the marker(s) to the commit message body, e.g.:\n");
  for (const m of missing) {
    process.stderr.write(`       [${m.marker}: verdict + date]\n`);
  }
  process.stderr.write("\nIf the review legitimately is not applicable (rare), add the marker with a justification:\n");
  process.stderr.write(`     [chain-tracer-ok: skipped - single-file refactor with no behavior change]\n\n`);
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

  process.stdout.write("scripts/check-review-markers.mjs self-test\n");

  // Trigger-map computation (against the placeholder RESKIN patterns).
  expect(
    "migration alone -> db-reviewer-ok",
    [...computeRequiredMarkers(["backend/migrations/099-test.sql"]).keys()].sort(),
    ["db-reviewer-ok"]
  );
  expect(
    "route file -> chain-tracer-ok",
    [...computeRequiredMarkers(["src/routes/foo.js"]).keys()].sort(),
    ["chain-tracer-ok"]
  );
  expect(
    "service file -> chain-tracer-ok",
    [...computeRequiredMarkers(["src/services/foo.js"]).keys()].sort(),
    ["chain-tracer-ok"]
  );
  expect(
    "db layer file -> db-reviewer-ok",
    [...computeRequiredMarkers(["src/db/client.js"]).keys()].sort(),
    ["db-reviewer-ok"]
  );
  expect(
    "cross-layer (ui + backend route) -> chain-tracer-ok",
    [...computeRequiredMarkers([
      "ui/panel.js",
      "src/routes/jobs.js",
    ]).keys()].sort(),
    ["chain-tracer-ok"]
  );
  expect(
    "docs only -> no markers",
    [...computeRequiredMarkers(["docs/foo.md", "HANDOFF.md"]).keys()].sort(),
    []
  );
  expect(
    "test files alone don't trigger db-reviewer",
    [...computeRequiredMarkers(["src/db/client.test.js"]).keys()].sort(),
    []
  );
  expect(
    "migration + route -> BOTH markers",
    [...computeRequiredMarkers([
      "backend/migrations/099-test.sql",
      "src/routes/jobs.js",
    ]).keys()].sort(),
    ["chain-tracer-ok", "db-reviewer-ok"]
  );
  expect(
    "ui alone (no backend) -> no markers (UI-only refactor is fine)",
    [...computeRequiredMarkers(["ui/panel.js"]).keys()].sort(),
    []
  );

  // Marker presence detection
  expect(
    "marker present (plain)",
    commitMessageHasMarker("fix: foo\n\n[db-reviewer-ok]", "db-reviewer-ok"),
    true
  );
  expect(
    "marker present (with justification)",
    commitMessageHasMarker("fix: foo\n\n[chain-tracer-ok: traced, verdict pass]", "chain-tracer-ok"),
    true
  );
  expect(
    "marker absent",
    commitMessageHasMarker("fix: foo\n\nno marker here", "db-reviewer-ok"),
    false
  );
  expect(
    "marker present but wrong one",
    commitMessageHasMarker("fix: foo\n\n[db-reviewer-ok]", "chain-tracer-ok"),
    false
  );
  expect(
    "marker case-insensitive",
    commitMessageHasMarker("fix: foo\n\n[DB-REVIEWER-OK]", "db-reviewer-ok"),
    true
  );

  process.stdout.write(`\nself-test: ${pass} passed, ${fail} failed\n`);
  if (fail > 0) process.exit(3);
  process.exit(0);
}

// Run when invoked directly (not when imported by a test).
const isMain = import.meta.url === `file://${resolve(process.argv[1] || "").replace(/\\/g, "/")}`
            || process.argv[1]?.endsWith("check-review-markers.mjs");
if (isMain) {
  main(process.argv.slice(2));
}
