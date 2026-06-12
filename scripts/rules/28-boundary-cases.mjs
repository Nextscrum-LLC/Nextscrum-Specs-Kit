// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/rules/28-boundary-cases.mjs
//
// R11 (boundary-case-first coding), warn-level. When a commit stages a folder
// spec's plan.md, that plan should make the edge cases visible: a "Boundary
// cases" section listing the empty / not-found / limit / race / idempotency /
// untrusted inputs the code handles in the same pass. This makes R11 a thing
// the author writes down, not a thing the reviewer has to reconstruct.
//
// WARNS rather than fails: a tiny plan may genuinely have no boundary surface,
// and a multi-commit feature may add the section in a later commit. The warning
// is the reminder; the human decides.
//
// No git context, or no staged changes (plain `node scripts/audit-rules.mjs`)
// => no-op (prints a skip line, exits 0).
//
// Self-test:  node scripts/rules/28-boundary-cases.mjs --self-test

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./_shared.mjs";

// RESKIN: point this at your specs folder layout if it differs.
const PLAN_FILE_RE = /^docs\/specs\/(\d{2,4})-[^/]+\/plan\.md$/;
// A "Boundary cases" section: a markdown heading or a bold lead-in. The token
// "boundary case(s)" with an optional space/hyphen, anchored to a heading/bold.
const BOUNDARY_RE = /(^|\n)\s*(#{1,6}\s+|\*\*\s*)boundary[ -]cases?/i;

/**
 * Given staged paths and a (path -> content) reader, return one entry per
 * staged plan.md that has no "Boundary cases" section.
 * Returns [{ num, path }].
 */
export function boundaryGaps(staged, readContent) {
  const gaps = [];
  for (const p of staged) {
    const m = p.match(PLAN_FILE_RE);
    if (!m) continue;
    let text;
    try {
      text = readContent(p);
    } catch {
      continue;
    }
    if (!BOUNDARY_RE.test(text)) gaps.push({ num: m[1], path: p });
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
  id: "boundary-cases",
  label: "boundary-cases: staged plan.md lists its boundary cases (warn)",
  async run({ ok, warn }) {
    let staged;
    try {
      staged = git("diff --cached --name-only")
        .split("\n")
        .filter(Boolean)
        .map((s) => s.replace(/\\/g, "/"));
    } catch {
      ok("boundary-cases: not a git context, skipped");
      return;
    }
    if (staged.length === 0) {
      ok("boundary-cases: no staged changes, nothing to check");
      return;
    }
    const gaps = boundaryGaps(staged, (p) => readFileSync(join(ROOT, p), "utf8"));
    if (gaps.length === 0) {
      ok("boundary-cases: staged plan.md files list their boundary cases (or none staged)");
      return;
    }
    for (const g of gaps) {
      warn(
        `boundary-cases: ${g.path} has no "Boundary cases" section. List the empty / not-found / limit / race / idempotency / untrusted cases the code handles (R11), or note why none apply.`,
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

  process.stdout.write("scripts/rules/28-boundary-cases.mjs self-test\n");

  const withSection = {
    "docs/specs/001-foo/plan.md": "## Approach\n\n## Boundary cases (R11)\n- empty\n",
  };
  const without = {
    "docs/specs/001-foo/plan.md": "## Approach\n\n## Analyze notes\n",
  };
  const boldSection = {
    "docs/specs/002-bar/plan.md": "**Boundary cases**\n- null inputs\n",
  };
  const read = (map) => (p) => {
    if (!(p in map)) throw new Error("no file");
    return map[p];
  };

  // plan.md with a Boundary cases heading -> no gap
  expect(
    "heading section -> no gap",
    boundaryGaps(["docs/specs/001-foo/plan.md"], read(withSection)),
    [],
  );
  // plan.md without the section -> gap
  expect(
    "missing section -> gap",
    boundaryGaps(["docs/specs/001-foo/plan.md"], read(without)),
    [{ num: "001", path: "docs/specs/001-foo/plan.md" }],
  );
  // bold lead-in also counts
  expect(
    "bold lead-in -> no gap",
    boundaryGaps(["docs/specs/002-bar/plan.md"], read(boldSection)),
    [],
  );
  // a spec.md / tasks.md change is ignored (only plan.md is checked)
  expect(
    "non-plan files ignored",
    boundaryGaps(["docs/specs/001-foo/spec.md", "src/server.js"], read(without)),
    [],
  );

  process.stdout.write(`\nself-test: ${pass} passed, ${failc} failed\n`);
  process.exit(failc > 0 ? 3 : 0);
}

const isMain = process.argv[1]?.endsWith("28-boundary-cases.mjs");
if (isMain && process.argv.includes("--self-test")) runSelfTest();
