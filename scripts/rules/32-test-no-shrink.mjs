// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/rules/32-test-no-shrink.mjs
//
// The test suite should accrete, not silently shrink. This warns when a commit
// deletes a test file or removes more test lines than it adds, so a drop in
// coverage is a visible decision, not an accident. Complements R8 (every
// criterion has a test) and R15 (every fix adds one).
//
// WARN-only: a legitimate test refactor can net-delete lines. The warning is the
// reminder; the human confirms it was intentional.
//
// Self-test:  node scripts/rules/32-test-no-shrink.mjs --self-test

import { execSync } from "node:child_process";
import { ROOT, isTestFile } from "./_shared.mjs";

/** Parse `git diff --cached --numstat` into [{ added, deleted, path }]. */
export function parseNumstat(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
    if (!m) continue;
    rows.push({
      added: m[1] === "-" ? 0 : Number(m[1]),
      deleted: m[2] === "-" ? 0 : Number(m[2]),
      path: m[3].replace(/\\/g, "/"),
    });
  }
  return rows;
}

/** Net test-line change and any fully-removed test files across the rows. */
export function analyzeTestChange(rows) {
  let net = 0;
  const removed = [];
  for (const r of rows) {
    if (!isTestFile(r.path)) continue;
    net += r.added - r.deleted;
    if (r.added === 0 && r.deleted > 0) removed.push(r.path);
  }
  return { net, removed };
}

export default {
  id: "test-no-shrink",
  label: "test-no-shrink: the test suite does not silently shrink (warn)",
  async run({ ok, warn }) {
    let numstat;
    try {
      numstat = execSync("git diff --cached --numstat", {
        cwd: ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
    } catch {
      ok("test-no-shrink: not a git context, skipped");
      return;
    }
    const { net, removed } = analyzeTestChange(parseNumstat(numstat));
    if (removed.length === 0 && net >= 0) {
      ok("test-no-shrink: staged test changes do not reduce coverage");
      return;
    }
    if (removed.length) {
      warn(`test-no-shrink: ${removed.length} test file(s) removed or emptied this commit (${removed.join(", ")}). Confirm this is intentional.`);
    }
    if (net < 0) {
      warn(`test-no-shrink: net ${-net} more test line(s) deleted than added this commit. Confirm the suite is not losing coverage.`);
    }
  },
};

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

  process.stdout.write("scripts/rules/32-test-no-shrink.mjs self-test\n");

  expect(
    "parseNumstat reads rows (and binary '-')",
    parseNumstat("12\t3\tsrc/a.test.js\n-\t-\timg.png"),
    [
      { added: 12, deleted: 3, path: "src/a.test.js" },
      { added: 0, deleted: 0, path: "img.png" },
    ],
  );

  const adding = parseNumstat("10\t0\tsrc/a.test.js\n5\t1\tsrc/b.js");
  expect("adding tests -> net positive, none removed", analyzeTestChange(adding), { net: 10, removed: [] });

  const shrinking = parseNumstat("2\t9\tsrc/a.test.js");
  expect("net-negative test change is flagged", analyzeTestChange(shrinking).net < 0, true);

  const deleted = parseNumstat("0\t40\te2e/checkout.spec.ts");
  expect("a removed test file is reported", analyzeTestChange(deleted).removed, ["e2e/checkout.spec.ts"]);

  const nonTest = parseNumstat("0\t40\tsrc/app.js");
  expect("non-test deletions are ignored", analyzeTestChange(nonTest), { net: 0, removed: [] });

  process.stdout.write(`\nself-test: ${pass} passed, ${failc} failed\n`);
  process.exit(failc > 0 ? 3 : 0);
}

const isMain = process.argv[1]?.endsWith("32-test-no-shrink.mjs");
if (isMain && process.argv.includes("--self-test")) runSelfTest();
