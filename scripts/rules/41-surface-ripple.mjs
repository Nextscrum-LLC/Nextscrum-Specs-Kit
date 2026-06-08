// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed.
//
// scripts/rules/41-surface-ripple.mjs
//
// Configurable surface-ripple engine, git-diff-aware. Some files are
// "surfaces" whose change should always be reflected in a companion doc
// (a decision record, an audit doc, a runbook). This rung WARNS when the
// staged diff touches a configured surface without also touching its
// required doc, so the doc never silently drifts from the surface.
//
// Generic form of a project-specific "if you touch X, update doc Y" guard.
// Examples: touching a migration requires a decision-record update; touching
// a public API requires the changelog; touching an auth surface requires the
// security doc.
//
// SHIPPED EMPTY. Out of the box the RULES array below is [], so this check
// passes silently and adds no noise. Fill it in per project (see the
// commented EXAMPLE) to turn it on.
//
// WARNS rather than fails: a multi-commit change may record the doc edit in
// an adjacent commit. The warning is the reminder; the human decides.
//
// No git context, or no staged changes (plain `node scripts/audit-rules.mjs`)
// => no-op (prints a skip line, exits 0). Diff-aware, so unrelated commits
// stay quiet.
//
// Self-test:  node scripts/rules/41-surface-ripple.mjs --self-test

import { execSync } from "node:child_process";
import { ROOT } from "./_shared.mjs";

// ---------- Config (RESKIN: fill this in) ----------
//
// Each rule:
//   surfaceGlobs  array of RegExp tested against each staged path (POSIX
//                 separators). Any match makes the surface "touched".
//   requiredDoc   the doc path (POSIX) that must also be in the diff.
//   label         human-readable name for the rule (for messages).
//
// EMPTY by default => inert. Uncomment and adapt the EXAMPLE to enable.
//
// EXAMPLE (neutral; not active):
//
//   {
//     label: "migrations require a decision record",
//     surfaceGlobs: [/^migrations\//],
//     requiredDoc: "docs/decisions/",
//   },
//
// Note: requiredDoc is satisfied if ANY staged path starts with it, so a
// directory prefix (e.g. "docs/decisions/") accepts any file beneath it,
// and an exact file path requires that exact file.
//
const RULES = [];

// ---------- Engine ----------

/**
 * Pure ripple check over a staged-path list. Returns one entry per rule
 * whose surface was touched but whose requiredDoc was not. Injectable
 * `rules` so the self-test can supply its own. Returns
 * [{ label, requiredDoc, files }].
 */
export function rippleGaps(staged, rules = RULES) {
  const gaps = [];
  for (const rule of rules) {
    const touched = staged.filter((p) =>
      rule.surfaceGlobs.some((re) => re.test(p)),
    );
    if (touched.length === 0) continue;
    const docSatisfied = staged.some((p) => p.startsWith(rule.requiredDoc));
    if (!docSatisfied) {
      gaps.push({ label: rule.label, requiredDoc: rule.requiredDoc, files: touched });
    }
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
  id: "surface-ripple",
  label: "surface-ripple: surface change ripples to its required doc (warn)",
  async run({ ok, warn }) {
    if (RULES.length === 0) {
      ok("surface-ripple: no surfaces configured, nothing to check");
      return;
    }
    let staged;
    try {
      staged = git("diff --cached --name-only")
        .split("\n")
        .filter(Boolean)
        .map((s) => s.replace(/\\/g, "/"));
    } catch {
      ok("surface-ripple: not a git context, skipped");
      return;
    }
    if (staged.length === 0) {
      ok("surface-ripple: no staged changes, nothing to check");
      return;
    }
    const gaps = rippleGaps(staged);
    if (gaps.length === 0) {
      ok("surface-ripple: configured surface changes carry their required doc (or none changed)");
      return;
    }
    for (const g of gaps) {
      warn(
        `surface-ripple: [${g.label}] this commit changes ${g.files.slice(0, 3).join(", ")}${g.files.length > 3 ? ` (and ${g.files.length - 3} more)` : ""} but does NOT touch ${g.requiredDoc}. Update it in the same commit, or confirm the doc legitimately does not need to move.`,
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

  process.stdout.write("scripts/rules/41-surface-ripple.mjs self-test\n");

  // A temp config (neutral examples), exercised against staged-path lists.
  const rules = [
    {
      label: "migrations require a decision record",
      surfaceGlobs: [/^migrations\//],
      requiredDoc: "docs/decisions/",
    },
  ];

  expect(
    "surface alone => gap",
    rippleGaps(["migrations/001-init.sql"], rules).map((g) => g.label),
    ["migrations require a decision record"],
  );
  expect(
    "surface + required doc => no gap",
    rippleGaps(
      ["migrations/001-init.sql", "docs/decisions/0005-schema.md"],
      rules,
    ),
    [],
  );
  expect(
    "unrelated file => no gap",
    rippleGaps(["src/server.js"], rules),
    [],
  );
  expect(
    "touched files reported",
    rippleGaps(["migrations/001-init.sql", "migrations/002-add.sql"], rules).map(
      (g) => g.files,
    ),
    [["migrations/001-init.sql", "migrations/002-add.sql"]],
  );
  // Empty shipped config => inert.
  expect("empty rule set yields no gaps", rippleGaps(["migrations/001-init.sql"], []), []);

  process.stdout.write(`\nself-test: ${pass} passed, ${failc} failed\n`);
  process.exit(failc > 0 ? 3 : 0);
}

const isMain = process.argv[1]?.endsWith("41-surface-ripple.mjs");
if (isMain && process.argv.includes("--self-test")) runSelfTest();
