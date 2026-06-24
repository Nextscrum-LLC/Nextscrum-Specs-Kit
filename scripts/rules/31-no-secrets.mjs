// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/rules/31-no-secrets.mjs
//
// R14: no secrets or machine-specific paths in committed content. Scans the
// STAGED DIFF (added lines only) and blocks the commit on a match. This is the
// content-level complement to .gitignore: .gitignore keeps sensitive FILES out
// of git; this keeps a secret or a personal path pasted INTO a tracked file out
// of git (the exact gap that let machine paths reach a tracked settings file).
//
// What it flags (added lines only, so pre-existing content is never re-scanned):
//   - private-key blocks, AWS access-key ids, GitHub / Slack / Google / OpenAI
//     style tokens;
//   - machine-specific home paths (C:\Users\<name>, /home/<name>/, /Users/<name>/).
//
// Per-line opt-out: append `nss-allow` in a comment on a line that is a known
// false positive (a fixture, a documented example). Use it sparingly; it is
// auditable in the diff.
//
// RESKIN: add project-specific strings to EXTRA_TERMS (internal hostnames,
// codenames, a personal directory name). Ships EMPTY so the kit leaks nothing.
//
// Self-test:  node scripts/rules/31-no-secrets.mjs --self-test

import { execSync } from "node:child_process";
import { ROOT } from "./_shared.mjs";

// RESKIN: extra literal strings to forbid in commits (case-insensitive). Empty
// by default: do NOT commit real project names or personal terms into the kit.
export const EXTRA_TERMS = [];

// Files never scanned: this checker (it necessarily contains the patterns and
// fixtures) and lock files (large, integrity hashes are noise here).
export const SKIP_FILES = new Set([
  "scripts/rules/31-no-secrets.mjs",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
]);

const OPT_OUT = /nss-allow/i;

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildRules(extraTerms = EXTRA_TERMS) {
  const rules = [
    { name: "private-key", re: /-----BEGIN (?:RSA |EC |OPENSSH |PGP |DSA )?PRIVATE KEY-----/ },
    { name: "aws-access-key", re: /\bAKIA[0-9A-Z]{16}\b/ },
    { name: "github-token", re: /\bgh[posru]_[A-Za-z0-9]{36,}\b/ },
    { name: "slack-token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/ },
    { name: "google-api-key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
    { name: "openai-key", re: /\bsk-[A-Za-z0-9]{32,}\b/ },
    { name: "windows-user-path", re: /\b[A-Za-z]:[\\/]Users[\\/][A-Za-z0-9._-]+/ },
    { name: "unix-home-path", re: /\/home\/[A-Za-z0-9._-]+\// },
    { name: "macos-user-path", re: /\/Users\/[A-Za-z0-9._-]+\// },
  ];
  if (extraTerms.length) {
    rules.push({ name: "project-term", re: new RegExp(extraTerms.map(escapeRe).join("|"), "i") });
  }
  return rules;
}

/**
 * Pure core. `added` is [{ file, text }] (one entry per added diff line).
 * Returns [{ file, rule }] for every flagged line, skipping exempt files and
 * lines that carry the opt-out marker. Never returns the matched value itself.
 */
export function scan(added, extraTerms = EXTRA_TERMS) {
  const rules = buildRules(extraTerms);
  const findings = [];
  for (const { file, text } of added) {
    if (SKIP_FILES.has(file)) continue;
    if (OPT_OUT.test(text)) continue;
    for (const r of rules) {
      if (r.re.test(text)) {
        findings.push({ file, rule: r.name });
        break; // one finding per line is enough to block
      }
    }
  }
  return findings;
}

/** Parse `git diff --cached -U0` into [{ file, text }] of added lines. */
export function parseAddedLines(diff) {
  const added = [];
  let file = null;
  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ b/")) {
      file = line.slice(6);
    } else if (line.startsWith("+++ ")) {
      file = null; // /dev/null etc.
    } else if (line.startsWith("+") && !line.startsWith("+++") && file) {
      added.push({ file, text: line.slice(1) });
    }
  }
  return added;
}

export default {
  id: "no-secrets",
  label: "R14 no-secrets: no secrets or machine-specific paths in the staged diff",
  async run({ fail, ok }) {
    let diff;
    try {
      diff = execSync("git diff --cached --unified=0", {
        cwd: ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        maxBuffer: 64 * 1024 * 1024,
      });
    } catch {
      ok("R14 no-secrets: not a git context, skipped");
      return;
    }
    const added = parseAddedLines(diff);
    if (added.length === 0) {
      ok("R14 no-secrets: no staged additions, nothing to check");
      return;
    }
    const findings = scan(added);
    if (findings.length === 0) {
      ok("R14 no-secrets: no secrets or machine-specific paths in staged additions");
      return;
    }
    // Report file + rule name only; never echo the matched value.
    for (const f of findings) {
      fail(`R14 no-secrets: a "${f.rule}" pattern was added in ${f.file}. Remove it (use env / a placeholder), or append "nss-allow" on that line if it is a known-safe example.`);
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
      process.stdout.write(`  x ${name}\n     expected ${JSON.stringify(expected)} got ${JSON.stringify(actual)}\n`);
    }
  };

  process.stdout.write("scripts/rules/31-no-secrets.mjs self-test\n");

  // Synthetic fixtures only (a documented AWS example id, a fake path). nss-allow
  const awsExample = "AKIA" + "IOSFODNN7EXAMPLE"; // split so this source line never itself matches
  const ruleOf = (text, file = "src/x.js") => scan([{ file, text }]).map((f) => f.rule);

  expect("flags a private-key block", ruleOf("-----BEGIN RSA PRIVATE KEY-----"), ["private-key"]);
  expect("flags an AWS access-key id", ruleOf(`const k = "${awsExample}";`), ["aws-access-key"]);
  expect("flags a windows user path", ruleOf("const p = 'C:/Users/alice/app';"), ["windows-user-path"]);
  expect("flags a unix home path", ruleOf("path = '/home/alice/app'"), ["unix-home-path"]);
  expect("clean line is clean", ruleOf("const total = a + b;"), []);
  expect("placeholder path does not match", ruleOf("see C:/Users/<name>/app"), []);
  expect("opt-out marker skips the line", ruleOf(`const k = "${awsExample}"; // nss-allow`), []);
  expect("the checker's own file is skipped", scan([{ file: "scripts/rules/31-no-secrets.mjs", text: awsExample }]), []);
  expect("EXTRA_TERMS flags a configured term", scan([{ file: "src/x.js", text: "host internal-thing" }], ["internal-thing"]).map((f) => f.rule), ["project-term"]);

  // Diff parser
  const diff = [
    "diff --git a/src/x.js b/src/x.js",
    "--- a/src/x.js",
    "+++ b/src/x.js",
    "@@ -0,0 +1 @@",
    "+const ok = 1;",
    "diff --git a/secret.txt b/secret.txt",
    "+++ b/secret.txt",
    "@@ -0,0 +1 @@",
    `+${awsExample}`,
  ].join("\n");
  expect("parseAddedLines collects added lines per file", parseAddedLines(diff), [
    { file: "src/x.js", text: "const ok = 1;" },
    { file: "secret.txt", text: awsExample },
  ]);

  process.stdout.write(`\nself-test: ${pass} passed, ${failc} failed\n`);
  process.exit(failc > 0 ? 3 : 0);
}

const isMain = process.argv[1]?.endsWith("31-no-secrets.mjs");
if (isMain && process.argv.includes("--self-test")) runSelfTest();
