// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed.
//
// scripts/rules/26-spec-change-ripple.mjs
//
// Downstream ripple, git-diff-aware rung. When a commit edits a folder
// spec's spec.md (the EARS criteria / contract), that spec's tasks.md AND
// tests.md should be edited in the SAME commit, so the work breakdown and
// the coverage matrix never silently drift from the requirement. This
// complements 24-record-facts-ripple (which covers the spec -> architecture
// docs ripple on landing); this one covers the spec.md -> tasks.md/tests.md
// ripple on change.
//
// WARNS rather than fails: a legitimate multi-commit feature may touch
// spec.md in one commit and tests.md in the next. The warning is the
// reminder; the human decides. (The static "criteria need a tests.md" hard
// check lives in 25-test-coverage.)
//
// No git context, or no staged changes (plain `node scripts/audit-rules.mjs`)
// => no-op (prints a skip line, exits 0).
//
// Self-test:  node scripts/rules/26-spec-change-ripple.mjs --self-test

import { execSync } from "node:child_process";
import { ROOT } from "./_shared.mjs";

// RESKIN: point this at your specs folder layout if it differs.
const SPEC_FILE_RE = /^docs\/specs\/(\d{2,4})-[^/]+\/spec\.md$/;

/**
 * Given the list of staged paths, return one entry per spec whose spec.md
 * changed but whose tasks.md and/or tests.md did NOT also change.
 * Returns [{ num, folder, missing: ["tasks.md", ...] }].
 */
export function rippleGaps(staged) {
  const set = new Set(staged);
  const gaps = [];
  for (const p of staged) {
    const m = p.match(SPEC_FILE_RE);
    if (!m) continue;
    const folder = p.slice(0, p.lastIndexOf("/")); // docs/specs/NNN-name
    const missing = ["tasks.md", "tests.md"].filter(
      (f) => !set.has(`${folder}/${f}`),
    );
    if (missing.length) gaps.push({ num: m[1], folder, missing });
  }
  return gaps;
}

function git(cmd) {
  return execSync(`git ${cmd}`, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
}

export default {
  id: "spec-change-ripple",
  label: "spec-change-ripple: spec.md change ripples to tasks.md + tests.md (warn)",
  async run({ ok, warn }) {
    let staged;
    try {
      staged = git("diff --cached --name-only")
        .split("\n")
        .filter(Boolean)
        .map((s) => s.replace(/\\/g, "/"));
    } catch {
      ok("spec-change-ripple: not a git context, skipped");
      return;
    }
    if (staged.length === 0) {
      ok("spec-change-ripple: no staged changes, nothing to check");
      return;
    }
    const gaps = rippleGaps(staged);
    if (gaps.length === 0) {
      ok("spec-change-ripple: spec.md changes carry their tasks.md + tests.md (or none changed)");
      return;
    }
    for (const g of gaps) {
      warn(
        `spec-change-ripple: ${g.folder}/spec.md changed but ${g.missing.join(" + ")} not touched this commit. Update them so tasks/tests stay in sync with the requirement (or land them in a follow-up commit if intentional).`,
      );
    }
  },
};

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
      process.stdout.write(
        `  x ${name}\n     expected ${JSON.stringify(expected)} got ${JSON.stringify(actual)}\n`,
      );
    }
  };

  process.stdout.write("scripts/rules/26-spec-change-ripple.mjs self-test\n");

  // spec.md alone -> both missing
  expect(
    "spec.md alone flags both",
    rippleGaps(["docs/specs/097-three-queue-redesign/spec.md"]),
    [
      {
        num: "097",
        folder: "docs/specs/097-three-queue-redesign",
        missing: ["tasks.md", "tests.md"],
      },
    ],
  );
  // spec.md + tasks.md -> tests.md missing
  expect(
    "spec.md + tasks.md flags tests.md",
    rippleGaps([
      "docs/specs/097-three-queue-redesign/spec.md",
      "docs/specs/097-three-queue-redesign/tasks.md",
    ]),
    [
      {
        num: "097",
        folder: "docs/specs/097-three-queue-redesign",
        missing: ["tests.md"],
      },
    ],
  );
  // all three -> no gap
  expect(
    "all three -> no gap",
    rippleGaps([
      "docs/specs/097-three-queue-redesign/spec.md",
      "docs/specs/097-three-queue-redesign/tasks.md",
      "docs/specs/097-three-queue-redesign/tests.md",
    ]),
    [],
  );
  // unrelated file -> no gap
  expect("unrelated file ignored", rippleGaps(["src/server.js"]), []);
  // tasks.md only (no spec.md change) -> no gap (this rung only fires on spec.md)
  expect(
    "tasks.md only ignored",
    rippleGaps(["docs/specs/097-three-queue-redesign/tasks.md"]),
    [],
  );

  process.stdout.write(`\nself-test: ${pass} passed, ${failc} failed\n`);
  process.exit(failc > 0 ? 3 : 0);
}

const isMain = process.argv[1]?.endsWith("26-spec-change-ripple.mjs");
if (isMain && process.argv.includes("--self-test")) runSelfTest();
