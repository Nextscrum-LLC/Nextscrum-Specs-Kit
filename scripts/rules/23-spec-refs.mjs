// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/rules/23-spec-refs.mjs
//
// Spec dependency integrity. Three checks, all cheap and high-value:
//
//   1. Dangling-reference detector. Every SPEC-NNN mentioned inside the
//      ledger (supersedes / parent / depends-on / pairs-with prose) must
//      point at a real ### SPEC-NNN entry. Catches rename gaps where a
//      pointer still names an id that no longer exists.
//
//   2. Cycle detection on depends-on. A "Depends-on:" loop (A needs B
//      needs A) has no valid build order and is rejected. Reads the
//      structured spec.md files under docs/specs/.
//
//   3. Facts-to-Record target existence. Each spec folder's plan.md names
//      the docs that must be updated when the spec lands; this verifies
//      every named target actually exists (catches typos / stale pointers).
//
// Self-test:  node scripts/rules/23-spec-refs.mjs --self-test

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { ROOT } from "./_shared.mjs";

// RESKIN: point these at your ledger + specs folder if they differ.
const LEDGER = resolve(ROOT, "docs", "requirements.md");
const SPECS_DIR = resolve(ROOT, "docs", "specs");

// Match a 2-4 digit SPEC id. Phase suffixes (SPEC-097-D) resolve to the
// base id, which is what the ledger entry is keyed on.
const ID_RE = /\bSPEC-\d{2,4}\b/g;

/** Valid ids = every "### SPEC-NNN" entry header in the ledger. */
export function ledgerIds(md) {
  const ids = new Set();
  const re = /^### (SPEC-\d{2,4})\b/gm;
  let m;
  while ((m = re.exec(md))) ids.add(m[1]);
  return ids;
}

/**
 * Every SPEC-NNN referenced in the ledger body (skipping the entry
 * header lines themselves) that is NOT a valid id. Returns Map<id, count>.
 */
export function danglingRefs(md, validIds) {
  const bad = new Map();
  for (const line of md.split("\n")) {
    if (/^###\s+SPEC-\d{2,4}\b/.test(line)) continue; // the header defines, not references
    for (const ref of line.match(ID_RE) || []) {
      if (!validIds.has(ref)) bad.set(ref, (bad.get(ref) || 0) + 1);
    }
  }
  return bad;
}

/**
 * Build a depends-on graph from the structured spec folders. Reads each
 * docs/specs/<NNN-name>/spec.md and parses the "Depends-on:" line.
 * Returns Map<specId, Set<dependsOnId>>. specId derived from folder name.
 */
export function dependsGraph(specsDir) {
  const graph = new Map();
  if (!existsSync(specsDir)) return graph;
  for (const folder of readdirSync(specsDir)) {
    const m = folder.match(/^(\d{2,4})-/);
    if (!m) continue;
    const id = `SPEC-${m[1]}`;
    const specPath = join(specsDir, folder, "spec.md");
    if (!existsSync(specPath)) continue;
    const md = readFileSync(specPath, "utf8");
    const deps = new Set();
    // "- **Depends-on:** SPEC-093 (...)" or "none"
    const line = md.match(/\*\*Depends-on:\*\*\s*([^\n]+)/i);
    if (line) {
      for (const ref of line[1].match(ID_RE) || []) {
        if (ref !== id) deps.add(ref);
      }
    }
    graph.set(id, deps);
  }
  return graph;
}

/**
 * For each spec folder's plan.md, the "Facts to Record" section names the
 * docs that must be updated when the spec lands. This check makes sure
 * every named target actually exists (catches typos and stale pointers).
 * It does NOT yet enforce "updated in the same commit". Returns
 * [{ spec, missing }].
 */
export function factsToRecordIssues(specsDir) {
  const issues = [];
  if (!existsSync(specsDir)) return issues;
  for (const folder of readdirSync(specsDir)) {
    const planPath = join(specsDir, folder, "plan.md");
    if (!existsSync(planPath)) continue;
    const md = readFileSync(planPath, "utf8");
    // Grab the "Facts to Record" section up to the next ## heading.
    const sec = md.match(/##\s*Facts to Record[^\n]*\n([\s\S]*?)(?:\n##\s|\n#\s|$)/i);
    if (!sec) continue;
    const targets = [...new Set(sec[1].match(/docs\/[A-Za-z0-9_\-/]+\.md/g) || [])];
    for (const t of targets) {
      if (!existsSync(resolve(ROOT, t))) issues.push({ spec: folder, missing: t });
    }
  }
  return issues;
}

/** Detect a cycle via DFS coloring. Returns the cycle path or null. */
export function findCycle(graph) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map([...graph.keys()].map((k) => [k, WHITE]));
  const stack = [];
  let cycle = null;

  function dfs(node) {
    color.set(node, GRAY);
    stack.push(node);
    for (const next of graph.get(node) || []) {
      if (!graph.has(next)) continue; // dangling deps handled by check 1
      if (color.get(next) === GRAY) {
        cycle = [...stack.slice(stack.indexOf(next)), next];
        return true;
      }
      if (color.get(next) === WHITE && dfs(next)) return true;
    }
    stack.pop();
    color.set(node, BLACK);
    return false;
  }

  for (const node of graph.keys()) {
    if (color.get(node) === WHITE && dfs(node)) break;
  }
  return cycle;
}

export default {
  id: "r-spec-refs",
  label: "spec-refs: dependency integrity (dangling refs + cycles)",
  async run({ fail, ok }) {
    if (!existsSync(LEDGER)) {
      ok("R7 spec-refs: no ledger yet, nothing to check");
      return;
    }
    const md = readFileSync(LEDGER, "utf8");
    const valid = ledgerIds(md);
    const dangling = danglingRefs(md, valid);

    if (dangling.size === 0) {
      ok(`R7 spec-refs: all SPEC-NNN references resolve (${valid.size} entries)`);
    } else {
      const list = [...dangling.entries()]
        .map(([id, n]) => `${id} (x${n})`)
        .join(", ");
      fail(`R7 spec-refs: ${dangling.size} dangling SPEC reference(s) in the ledger: ${list}. Each must point at a real ### SPEC-NNN entry (or be fixed if it is a leftover from a rename).`);
    }

    const cycle = findCycle(dependsGraph(SPECS_DIR));
    if (cycle) {
      fail(`R7 spec-refs: depends-on cycle detected: ${cycle.join(" -> ")}. A dependency loop has no valid build order; break it.`);
    } else {
      ok("R7 spec-refs: no depends-on cycles");
    }

    const ftr = factsToRecordIssues(SPECS_DIR);
    if (ftr.length === 0) {
      ok("R7 spec-refs: all Facts-to-Record targets exist");
    } else {
      const list = ftr.map((i) => `${i.spec} -> ${i.missing}`).join(", ");
      fail(`R7 spec-refs: ${ftr.length} Facts-to-Record target(s) do not exist: ${list}. Fix the path in plan.md or create the doc.`);
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
      failc++; process.stdout.write(`  x ${name}\n     expected ${JSON.stringify(expected)} got ${JSON.stringify(actual)}\n`);
    }
  };

  process.stdout.write("scripts/rules/23-spec-refs.mjs self-test\n");

  const sample = `# Ledger
### SPEC-001 (2026-01-01) - A
- supersedes SPEC-002
### SPEC-002 (2026-01-01) - B
- **Status:** superseded
### SPEC-003 (2026-01-01) - C
- depends-on SPEC-999
`;
  const ids = ledgerIds(sample);
  expect("collects 3 ids", [...ids].sort(), ["SPEC-001", "SPEC-002", "SPEC-003"]);
  const dangling = danglingRefs(sample, ids);
  expect("flags SPEC-999 as dangling", [...dangling.keys()], ["SPEC-999"]);
  expect("does not flag valid SPEC-002 ref", dangling.has("SPEC-002"), false);

  // Cycle detection
  const acyclic = new Map([
    ["SPEC-001", new Set(["SPEC-002"])],
    ["SPEC-002", new Set()],
  ]);
  expect("no cycle in acyclic graph", findCycle(acyclic), null);
  const cyclic = new Map([
    ["SPEC-001", new Set(["SPEC-002"])],
    ["SPEC-002", new Set(["SPEC-001"])],
  ]);
  expect("detects 2-node cycle", findCycle(cyclic) !== null, true);

  process.stdout.write(`\nself-test: ${pass} passed, ${failc} failed\n`);
  process.exit(failc > 0 ? 3 : 0);
}

const isMain = process.argv[1]?.endsWith("23-spec-refs.mjs");
if (isMain && process.argv.includes("--self-test")) runSelfTest();
