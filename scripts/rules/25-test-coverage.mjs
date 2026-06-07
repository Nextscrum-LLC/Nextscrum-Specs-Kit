// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/rules/25-test-coverage.mjs
//
// Test-coverage gate (WARN-first). For every spec folder under
// docs/specs/<NNN-name>/, every EARS acceptance criterion in spec.md must
// be referenced by at least one test in the sibling tests.md (the 4th spec
// file).
//
// Two warnings, both cheap:
//   1. A spec folder has acceptance criteria but no tests.md at all.
//   2. A criterion (C<n>) is not referenced anywhere in tests.md.
//
// WARN-only by design (advisory first, then promote to a hard done-gate
// block once it has run clean on 2-3 real specs). It also does not yet
// verify the mandatory-floor dimensions (func / sec / a11y) are each
// present per criterion; that dimension-level rung is the next promotion.
//
// Self-test:  node scripts/rules/25-test-coverage.mjs --self-test

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { ROOT } from "./_shared.mjs";

// RESKIN: point this at your specs folder if it differs.
const SPECS_DIR = resolve(ROOT, "docs", "specs");

/**
 * The set of acceptance-criterion numbers declared in a spec.md. Reads the
 * "## Acceptance criteria ..." section and collects the leading number of
 * each list item. Returns Set<number>. Empty if there is no such section.
 */
export function requiredCriteria(specMd) {
  const nums = new Set();
  const sec = specMd.match(
    /##\s*Acceptance criteria[^\n]*\n([\s\S]*?)(?:\n##\s|\n#\s|$)/i,
  );
  if (!sec) return nums;
  for (const line of sec[1].split("\n")) {
    const m = line.match(/^\s*(\d+)\.\s/);
    if (m) nums.add(Number(m[1]));
  }
  return nums;
}

/**
 * The set of criterion numbers referenced by tests.md. Matches the C<n>
 * token used in the coverage matrix and the SPEC-NNN/C<n>/dim/case ids.
 * Returns Set<number>.
 */
export function coveredCriteria(testsMd) {
  const nums = new Set();
  for (const m of testsMd.matchAll(/\bC(\d+)\b/g)) nums.add(Number(m[1]));
  return nums;
}

/**
 * Per spec folder, the coverage issue (if any). Returns
 * [{ spec, kind: "no-tests-md" | "uncovered", missing }].
 */
export function coverageIssues(specsDir) {
  const issues = [];
  if (!existsSync(specsDir)) return issues;
  for (const folder of readdirSync(specsDir)) {
    const specPath = join(specsDir, folder, "spec.md");
    if (!existsSync(specPath)) continue;
    const required = requiredCriteria(readFileSync(specPath, "utf8"));
    if (required.size === 0) continue; // nothing to cover
    const testsPath = join(specsDir, folder, "tests.md");
    if (!existsSync(testsPath)) {
      issues.push({ spec: folder, kind: "no-tests-md", missing: [...required] });
      continue;
    }
    const covered = coveredCriteria(readFileSync(testsPath, "utf8"));
    const missing = [...required].filter((n) => !covered.has(n));
    if (missing.length) issues.push({ spec: folder, kind: "uncovered", missing });
  }
  return issues;
}

export default {
  id: "spec-test-coverage",
  label: "test-coverage: every EARS criterion referenced by tests.md (warn-only)",
  async run({ ok, warn }) {
    if (!existsSync(SPECS_DIR)) {
      ok("R8 test-coverage: no specs/ folder yet, nothing to check");
      return;
    }
    const issues = coverageIssues(SPECS_DIR);
    if (issues.length === 0) {
      ok("R8 test-coverage: every spec folder's criteria are referenced in tests.md");
      return;
    }
    for (const i of issues) {
      if (i.kind === "no-tests-md") {
        warn(
          `R8 test-coverage: ${i.spec} has ${i.missing.length} acceptance criteria but no tests.md. Generate the coverage matrix.`,
        );
      } else {
        const list = i.missing.map((n) => `C${n}`).join(", ");
        warn(
          `R8 test-coverage: ${i.spec} criteria not referenced in tests.md: ${list}. Cover the gaps.`,
        );
      }
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
      process.stdout.write(
        `  x ${name}\n     expected ${JSON.stringify(expected)} got ${JSON.stringify(actual)}\n`,
      );
    }
  };

  process.stdout.write("scripts/rules/25-test-coverage.mjs self-test\n");

  const spec = `# Spec
## Acceptance criteria (EARS)
1. WHEN a THE SYSTEM SHALL b
2. WHEN c THE SYSTEM SHALL d
3. IF e THEN THE SYSTEM SHALL f
## Rules touched
- R3
`;
  expect("collects criteria 1,2,3", [...requiredCriteria(spec)].sort(), [1, 2, 3]);

  const tests = `# Tests
| C1 foo | V |
| C3 bar | P |
- SPEC-001/C3/func/happy
`;
  expect("covered = {1,3}", [...coveredCriteria(tests)].sort(), [1, 3]);

  const noSec = `# Spec\nno criteria here\n`;
  expect("no criteria section -> empty", [...requiredCriteria(noSec)], []);

  process.stdout.write(`\nself-test: ${pass} passed, ${failc} failed\n`);
  process.exit(failc > 0 ? 3 : 0);
}

const isMain = process.argv[1]?.endsWith("25-test-coverage.mjs");
if (isMain && process.argv.includes("--self-test")) runSelfTest();
