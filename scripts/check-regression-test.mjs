// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/check-regression-test.mjs
//
// R15: a bug fix must add a regression test. When a `fix:` commit changes
// source but touches no test, the failure that prompted the fix is not locked
// against coming back. This mechanizes Playbook B ("write the failing test
// first, then fix"): the suite accretes a permanent case from every failure.
//
// Runs in the commit-msg hook (where the Conventional type is known). Advisory
// by default (warns, exit 0); SPECKIT_STRICT=1 makes it block (exit 1). A fix
// with no testable surface (a comment typo) can opt out with a
// `[no-regression-test: <reason>]` marker in the commit message.
//
// Usage:      node scripts/check-regression-test.mjs <commit-msg-file>
// Self-test:  node scripts/check-regression-test.mjs --self-test

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { isStrict, isTestFile, isSourceFile } from "./rules/_shared.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const OPT_OUT = /\[no-regression-test\b/i;

/** The Conventional type of a subject line ("fix(scope)!: x" -> "fix"), or null. */
export function commitType(subject) {
  const m = subject.match(/^(\w+)(?:\([^)]*\))?!?:/);
  return m ? m[1].toLowerCase() : null;
}

/**
 * Pure core. Returns a gap object when a fix changes source without touching a
 * test, else null. `files` is the staged path list.
 */
export function regressionGap(subject, files) {
  if (OPT_OUT.test(subject)) return null;
  if (commitType(subject) !== "fix") return null;
  if (!files.some(isSourceFile)) return null; // a fix with no source change (e.g. fix(docs))
  if (files.some(isTestFile)) return null; // a test was added or changed: good
  return { reason: "fix changes source but adds no test" };
}

function firstSubject(msg) {
  for (const line of msg.split("\n")) {
    const t = line.trim();
    if (t && !t.startsWith("#")) return t;
  }
  return "";
}

function main(args) {
  if (args.includes("--self-test")) return runSelfTest();

  const msgFile = args[0];
  if (!msgFile) {
    process.stderr.write("usage: check-regression-test.mjs <commit-msg-file>\n");
    process.exit(2);
  }
  let msg;
  try {
    msg = readFileSync(msgFile, "utf8");
  } catch {
    process.exit(0); // no message file: nothing to enforce
  }
  let files = [];
  try {
    files = execSync("git diff --cached --name-only", { cwd: ROOT, encoding: "utf8" })
      .split("\n")
      .filter(Boolean)
      .map((s) => s.replace(/\\/g, "/"));
  } catch {
    process.exit(0); // not a git context
  }

  const gap = regressionGap(firstSubject(msg), files);
  if (!gap) process.exit(0);

  if (isStrict()) {
    process.stderr.write("x  commit-msg blocked: R15 regression-on-fix - this fix changes source but adds no test.\n");
    process.stderr.write("   Add the failing-test-first regression (Playbook B / /regress), or add\n");
    process.stderr.write("   `[no-regression-test: <reason>]` to the message if there is no testable surface.\n");
    process.exit(1);
  }
  process.stdout.write("!  R15 regression-on-fix: this fix changes source without touching a test.\n");
  process.stdout.write("   Add the regression test (Playbook B / /regress) so the bug cannot return.\n");
  process.stdout.write("   (warn only; set SPECKIT_STRICT=1 to enforce, or `[no-regression-test: <reason>]` to opt out.)\n");
  process.exit(0);
}

// ---------- Self-test ----------

function runSelfTest() {
  let pass = 0, failc = 0;
  const expect = (name, actual, expected) => {
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
      pass++; process.stdout.write(`  ok ${name}\n`);
    } else {
      failc++;
      process.stdout.write(`  x ${name}\n     expected ${JSON.stringify(expected)} got ${JSON.stringify(actual)}\n`);
    }
  };

  process.stdout.write("scripts/check-regression-test.mjs self-test\n");

  expect("commitType parses fix(scope)!", commitType("fix(api)!: drop"), "fix");
  expect("commitType parses feat", commitType("feat: add"), "feat");
  expect("commitType null on junk", commitType("just a message"), null);

  const gap = (s, f) => (regressionGap(s, f) ? "gap" : "ok");
  expect("fix + source + no test -> gap", gap("fix: bug", ["src/a.js"]), "gap");
  expect("fix + source + test -> ok", gap("fix: bug", ["src/a.js", "src/a.test.js"]), "ok");
  expect("fix touching a tests/ dir -> ok", gap("fix: bug", ["src/a.js", "tests/a.js"]), "ok");
  expect("feat + source + no test -> ok (only fixes require)", gap("feat: add", ["src/a.js"]), "ok");
  expect("fix(docs) only -> ok (no source)", gap("fix(docs): typo", ["docs/x.md"]), "ok");
  expect("fix with opt-out marker -> ok", gap("fix: comment typo [no-regression-test: no logic]", ["src/a.js"]), "ok");

  process.stdout.write(`\nself-test: ${pass} passed, ${failc} failed\n`);
  process.exit(failc > 0 ? 3 : 0);
}

const isMain = process.argv[1]?.endsWith("check-regression-test.mjs");
if (isMain) main(process.argv.slice(2));
