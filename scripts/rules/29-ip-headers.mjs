// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/rules/29-ip-headers.mjs
//
// R12: every source file carries a copyright / IP header on its first lines.
// The kit preaches this in engineering.md "Commenting standards"; this check
// locks it. Scoped to code files with line-comment syntax (.mjs/.cjs/.js/.ts/
// .tsx/.sql). Prose docs (.md) are governed by the voice rules (R1-R2), and
// config files (.json) have no comment syntax, so neither is scanned here.
//
// Hard fail (blocking): a missing header is a one-command fix
// (`npm run headers:fix`), so there is no reason to let it drift.
//
// RESKIN: set OWNER and LICENSE_NOTE to your copyright holder and license.
//
// Self-test:  node scripts/rules/29-ip-headers.mjs --self-test

import { readFileSync, readdirSync } from "node:fs";
import { join, extname, relative } from "node:path";
import { ROOT } from "./_shared.mjs";

// RESKIN: your copyright holder. The check matches
// "Copyright (c) <20xx> <OWNER>" anywhere in a file's first 5 lines.
export const OWNER = "NextScrum LLC";
// RESKIN: the license note the fixer writes (the check does not require it).
export const LICENSE_NOTE = "Apache-2.0 Licensed.";

// Code extensions that must carry a line-comment header.
export const HEADER_EXTS = new Set([".mjs", ".cjs", ".js", ".ts", ".tsx", ".sql"]);

// Directories the walk never descends into.
export const SKIP_DIRS = new Set([
  "node_modules", ".git", ".husky", ".vscode", "dist", "build", "coverage",
  "test-results", "playwright-report",
]);

const ownerEscaped = OWNER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const HEADER_RE = new RegExp(`Copyright \\(c\\) 20\\d\\d ${ownerEscaped}`);

/** True if this filename is a code file the header rule covers. */
export function isSource(name) {
  return HEADER_EXTS.has(extname(name));
}

/** True if the given head-of-file text carries the owner's copyright header. */
export function hasHeader(headText) {
  return HEADER_RE.test(headText);
}

/** The header line the fixer prepends, comment-styled per extension. */
export function headerLine(ext, year) {
  const text = `Copyright (c) ${year} ${OWNER}. ${LICENSE_NOTE}`;
  return ext === ".sql" ? `-- ${text}` : `// ${text}`;
}

/** Collect every source file under `dir` (absolute paths), skipping SKIP_DIRS. */
export function collectSources(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectSources(full, out);
    else if (entry.isFile() && isSource(entry.name)) out.push(full);
  }
  return out;
}

export default {
  id: "ip-headers",
  label: "R12 ip-headers: every source file carries the copyright header",
  async run({ fail, ok }) {
    const files = collectSources(ROOT);
    const missing = [];
    for (const f of files) {
      let head;
      try {
        head = readFileSync(f, "utf8").split("\n").slice(0, 5).join("\n");
      } catch {
        continue;
      }
      if (!hasHeader(head)) missing.push(relative(ROOT, f).replace(/\\/g, "/"));
    }
    if (missing.length === 0) {
      ok(`R12 ip-headers: all ${files.length} source files carry the header`);
      return;
    }
    for (const m of missing) {
      fail(`R12 ip-headers: ${m} has no "Copyright (c) <year> ${OWNER}" header. Run \`npm run headers:fix\`.`);
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

  process.stdout.write("scripts/rules/29-ip-headers.mjs self-test\n");

  expect("isSource true for .mjs", isSource("foo.mjs"), true);
  expect("isSource true for .sql", isSource("foo.sql"), true);
  expect("isSource false for .md", isSource("README.md"), false);
  expect("isSource false for .json", isSource("package.json"), false);
  expect(
    "hasHeader true for owner header",
    hasHeader("// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed.\nimport x"),
    true,
  );
  expect(
    "hasHeader false for no header",
    hasHeader("import x from 'y';\nconst a = 1;"),
    false,
  );
  expect(
    "hasHeader false for wrong owner",
    hasHeader("// Copyright (c) 2026 Someone Else. MIT.\n"),
    false,
  );
  expect("headerLine js style", headerLine(".mjs", 2026), "// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed.");
  expect("headerLine sql style", headerLine(".sql", 2026), "-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed.");

  process.stdout.write(`\nself-test: ${pass} passed, ${failc} failed\n`);
  process.exit(failc > 0 ? 3 : 0);
}

const isMain = process.argv[1]?.endsWith("29-ip-headers.mjs");
if (isMain && process.argv.includes("--self-test")) runSelfTest();
