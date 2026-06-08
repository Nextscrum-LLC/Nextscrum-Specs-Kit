// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed.
//
// scripts/rules/24-record-facts-ripple.mjs
//
// "Record Facts" ripple, git-diff-aware rung. When a commit moves a folder
// spec to status: done in the ledger (docs/requirements.md), the
// architecture docs that spec's plan.md lists under "Facts to Record"
// should be edited in the SAME commit, so the truth docs never drift.
//
// This rung WARNS rather than fails. A hard block would false-fail when the
// facts were legitimately recorded in an earlier commit of a multi-commit
// feature. The warning is the reminder; the human decides. The static
// "targets exist" rung in 23-spec-refs is the hard check.
//
// No git context, or no staged changes (plain `node scripts/audit-rules.mjs`)
// => no-op (prints a skip line, exits 0).
//
// Self-test:  node scripts/rules/24-record-facts-ripple.mjs --self-test

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, join } from "node:path";
import { ROOT } from "./_shared.mjs";

// RESKIN: point these at your ledger + specs folder if they differ.
const LEDGER_PATH = "docs/requirements.md";
const SPECS_DIR = resolve(ROOT, "docs", "specs");

/** Map<SPEC-NNN, status> parsed from a ledger markdown string. */
export function specStatuses(md) {
  const out = new Map();
  // Split on entry headers; read the first Status bullet in each body.
  const parts = md.split(/^### (SPEC-\d{2,4})\b/m);
  for (let i = 1; i < parts.length; i += 2) {
    const id = parts[i];
    const body = parts[i + 1] || "";
    const m = body.match(/^\s*-\s*\*\*Status:\*\*\s*([^\n(]+)/im);
    out.set(id, m ? m[1].trim() : null);
  }
  return out;
}

/** Ids that are `done` in `staged` but were not `done` in `head`. */
export function newlyDone(headMd, stagedMd) {
  const head = specStatuses(headMd);
  const staged = specStatuses(stagedMd);
  const ids = [];
  for (const [id, status] of staged) {
    if (status === "done" && head.get(id) !== "done") ids.push(id);
  }
  return ids;
}

/** Doc paths listed under "Facts to Record" in a spec folder's plan.md. */
export function factsForSpec(specsDir, id) {
  const num = id.replace(/^SPEC-/, "");
  if (!existsSync(specsDir)) return [];
  const folder = readdirSync(specsDir).find((f) => f.startsWith(`${num}-`));
  if (!folder) return [];
  const planPath = join(specsDir, folder, "plan.md");
  if (!existsSync(planPath)) return [];
  const md = readFileSync(planPath, "utf8");
  const sec = md.match(
    /##\s*Facts to Record[^\n]*\n([\s\S]*?)(?:\n##\s|\n#\s|$)/i,
  );
  if (!sec) return [];
  return [...new Set(sec[1].match(/docs\/[A-Za-z0-9_\-/]+\.md/g) || [])];
}

function git(cmd) {
  return execSync(`git ${cmd}`, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
}

export default {
  id: "record-facts-ripple",
  label: "record-facts-ripple: facts recorded when a spec lands done (warn)",
  async run({ ok, warn }) {
    let staged;
    try {
      staged = git("diff --cached --name-only")
        .split("\n")
        .filter(Boolean)
        .map((s) => s.replace(/\\/g, "/"));
    } catch {
      ok("record-facts-ripple: not a git context, skipped");
      return;
    }
    if (staged.length === 0) {
      ok("record-facts-ripple: no staged changes, nothing to check");
      return;
    }
    if (!staged.includes(LEDGER_PATH)) {
      ok("record-facts-ripple: ledger not in this commit, nothing to check");
      return;
    }

    let headMd = "";
    let stagedMd = "";
    try {
      headMd = git(`show HEAD:${LEDGER_PATH}`);
    } catch {
      headMd = "";
    }
    try {
      stagedMd = git(`show :${LEDGER_PATH}`);
    } catch {
      stagedMd = "";
    }

    const ids = newlyDone(headMd, stagedMd);
    if (ids.length === 0) {
      ok("record-facts-ripple: no spec newly marked done in this commit");
      return;
    }

    const stagedSet = new Set(staged);
    const reminders = [];
    for (const id of ids) {
      const facts = factsForSpec(SPECS_DIR, id);
      const untouched = facts.filter((p) => !stagedSet.has(p));
      if (untouched.length) reminders.push({ id, untouched });
    }

    if (reminders.length === 0) {
      ok("record-facts-ripple: all newly-done specs recorded their facts this commit");
      return;
    }
    for (const r of reminders) {
      warn(
        `record-facts-ripple: ${r.id} is now done but these Facts-to-Record docs were not touched this commit: ${r.untouched.join(", ")}. If you recorded them in an earlier commit, ignore; otherwise update them now so the architecture docs stay true.`,
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

  process.stdout.write("scripts/rules/24-record-facts-ripple.mjs self-test\n");

  const head = `### SPEC-001 (2026-01-01) - A
- **Status:** in-review
### SPEC-002 (2026-01-01) - B
- **Status:** done
`;
  const staged = `### SPEC-001 (2026-01-01) - A
- **Status:** done
### SPEC-002 (2026-01-01) - B
- **Status:** done
`;
  expect("specStatuses reads status", specStatuses(head).get("SPEC-001"), "in-review");
  expect("newlyDone flags only the transition", newlyDone(head, staged), ["SPEC-001"]);
  expect("already-done not re-flagged", newlyDone(staged, staged), []);
  expect("empty head => done is newly done", newlyDone("", staged).sort(), [
    "SPEC-001",
    "SPEC-002",
  ]);

  process.stdout.write(`\nself-test: ${pass} passed, ${failc} failed\n`);
  process.exit(failc > 0 ? 3 : 0);
}

const isMain = process.argv[1]?.endsWith("24-record-facts-ripple.mjs");
if (isMain && process.argv.includes("--self-test")) runSelfTest();
