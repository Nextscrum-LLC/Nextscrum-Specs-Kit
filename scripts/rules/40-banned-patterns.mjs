// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed.
//
// scripts/rules/40-banned-patterns.mjs
//
// Configurable banned-pattern engine. Scans matching source files for
// regexes you forbid and HARD-FAILS on a match, unless the offending line
// (or file) carries an auditable opt-out comment so every skip is greppable.
//
// This is the generic form of a project-specific "banned API" guard: a
// mechanical way to stop a class of code from re-entering the tree after
// you have decided it must not. Examples: an unsafe DOM sink, a deprecated
// helper, a direct database call from a route, a logging statement that
// leaks a secret.
//
// SHIPPED EMPTY. Out of the box the RULES array below is [], so this check
// passes silently and adds no noise. Fill it in per project (see the
// commented EXAMPLE) to turn it on.
//
// Self-test:  node scripts/rules/40-banned-patterns.mjs --self-test

import { readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { ROOT, walk } from "./_shared.mjs";

// ---------- Config (RESKIN: fill this in) ----------
//
// Each rule:
//   dir          absolute scan root (a directory under ROOT)
//   exts         file extensions to scan, e.g. [".js", ".ts"]
//   ignore       path components to skip, e.g. ["node_modules", "dist"]
//   patterns     [{ id, re }] regexes whose presence on a line is banned
//   allowComment a token that, when present on the same line (or anywhere
//                in the file), marks an audited, intentional exception
//   label        human-readable name for the rule group (for messages)
//
// EMPTY by default => inert. Uncomment and adapt the EXAMPLE to enable.
//
// EXAMPLE (neutral; not active):
//
//   {
//     label: "no unsafe sinks in src/",
//     dir: resolve(ROOT, "src"),
//     exts: [".js", ".ts"],
//     ignore: ["node_modules", "dist"],
//     allowComment: "banned-pattern-allow",
//     patterns: [
//       { id: "eval", re: /\beval\s*\(/ },
//       { id: "innerHTML-assign", re: /\.innerHTML\s*=/ },
//     ],
//   },
//
const RULES = [];

// ---------- Engine ----------

/**
 * Scan one file's text against one rule's patterns. A line carrying the
 * allowComment token is skipped (audited opt-out). Returns
 * [{ line, id, text }] for unallowed hits. Pure: takes the rule in, no I/O.
 */
export function scanContent(text, rule) {
  const out = [];
  const allow = rule.allowComment;
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (allow && line.includes(allow)) return; // audited opt-out
    for (const p of rule.patterns) {
      if (p.re.test(line)) out.push({ line: i + 1, id: p.id, text: line.trim() });
    }
  });
  return out;
}

/**
 * Run the whole rule set against the filesystem. Injectable `rules` so the
 * self-test can supply its own without touching the shipped config.
 * Returns [{ label, file, line, id, text }].
 */
export function scanAll(rules = RULES) {
  const violations = [];
  for (const rule of rules) {
    const files = walk(rule.dir, rule.exts || [".js"], rule.ignore || []);
    for (const f of files) {
      let text;
      try {
        text = readFileSync(f, "utf8");
      } catch {
        continue;
      }
      for (const hit of scanContent(text, rule)) {
        violations.push({
          label: rule.label,
          file: relative(ROOT, f).replace(/\\/g, "/"),
          ...hit,
        });
      }
    }
  }
  return violations;
}

export default {
  id: "banned-patterns",
  label: "banned-patterns: configured forbidden patterns absent from source (hard)",
  async run({ fail, ok }) {
    if (RULES.length === 0) {
      ok("banned-patterns: no patterns configured, nothing to check");
      return;
    }
    const violations = scanAll();
    if (violations.length === 0) {
      ok(`banned-patterns: no banned patterns found (${RULES.length} rule group(s))`);
      return;
    }
    for (const v of violations) {
      fail(
        `banned-patterns: [${v.label}] banned pattern '${v.id}' at ${v.file}:${v.line} - ${v.text}. Remove it, or add the audited opt-out comment on that line if this is a vetted exception.`,
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

  process.stdout.write("scripts/rules/40-banned-patterns.mjs self-test\n");

  // A temp config (neutral examples), exercised against sample content.
  const rule = {
    label: "no unsafe sinks",
    allowComment: "banned-pattern-allow",
    patterns: [
      { id: "eval", re: /\beval\s*\(/ },
      { id: "innerHTML-assign", re: /\.innerHTML\s*=/ },
    ],
  };

  expect(
    "flags eval(",
    scanContent("const r = eval(userInput);", rule).map((h) => h.id),
    ["eval"],
  );
  expect(
    "flags innerHTML assignment",
    scanContent("el.innerHTML = markup;", rule).map((h) => h.id),
    ["innerHTML-assign"],
  );
  expect(
    "allowComment opt-out respected",
    scanContent("el.innerHTML = safe; // banned-pattern-allow: static literal", rule),
    [],
  );
  expect("clean line is clean", scanContent("const x = 1;", rule), []);
  expect(
    "line number reported",
    scanContent("a;\nb;\neval(c);", rule).map((h) => h.line),
    [3],
  );
  // Empty shipped config => engine returns nothing.
  expect("empty rule set yields no violations", scanAll([]), []);

  process.stdout.write(`\nself-test: ${pass} passed, ${failc} failed\n`);
  process.exit(failc > 0 ? 3 : 0);
}

const isMain = process.argv[1]?.endsWith("40-banned-patterns.mjs");
if (isMain && process.argv.includes("--self-test")) runSelfTest();
