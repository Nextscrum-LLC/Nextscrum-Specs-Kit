// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/rules/29-ip-headers.mjs
//
// R12: every source and docs file carries a copyright / IP header on its first
// lines. The kit preaches this in engineering.md "Commenting standards"; this
// check locks it. Covered: code files with line-comment syntax (.mjs/.cjs/.js/
// .ts/.tsx/.sql) and Markdown (.md, with an HTML-comment header). Config files
// (.json) have no comment syntax and are not scanned.
//
// For Markdown with YAML frontmatter (--- ... ---), the header sits just after
// the frontmatter block, so the check looks past it.
//
// Hard fail (blocking): a missing header is a one-command fix
// (`npm run headers:fix`), so there is no reason to let it drift.
//
// RESKIN: set OWNER and LICENSE_NOTE to your copyright holder and license.
//
// Run:        node scripts/rules/29-ip-headers.mjs           (the check; npm run headers:check)
// Self-test:  node scripts/rules/29-ip-headers.mjs --self-test

import { readFileSync, readdirSync } from "node:fs";
import { join, extname, relative } from "node:path";
import { ROOT } from "./_shared.mjs";

// RESKIN: your copyright holder. The check matches
// "Copyright (c) <20xx> <OWNER>" near the top of every covered file.
export const OWNER = "NextScrum LLC";
// RESKIN: the license note the fixer writes (the check does not require it).
export const LICENSE_NOTE = "Apache-2.0 Licensed.";

// Extensions that must carry a header.
export const HEADER_EXTS = new Set([".mjs", ".cjs", ".js", ".ts", ".tsx", ".sql", ".md"]);

// Directories the walk never descends into.
export const SKIP_DIRS = new Set([
  "node_modules", ".git", ".husky", ".vscode", "dist", "build", "coverage",
  "test-results", "playwright-report",
]);

const ownerEscaped = OWNER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const HEADER_RE = new RegExp(`Copyright \\(c\\) 20\\d\\d ${ownerEscaped}`);

/** True if this filename is a file the header rule covers. */
export function isSource(name) {
  return HEADER_EXTS.has(extname(name));
}

/** Drop a leading YAML frontmatter block (--- ... ---) so the header check
 * can look at the line that follows it. Returns the remaining text. */
export function stripFrontmatter(content) {
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) return content;
  const m = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  return m ? content.slice(m[0].length) : content;
}

/** True if the file content carries the owner's copyright header near the top
 * (after any frontmatter). */
export function fileHasHeader(content) {
  const head = stripFrontmatter(content).split("\n").slice(0, 5).join("\n");
  return HEADER_RE.test(head);
}

/** The header line the fixer prepends, comment-styled per extension. */
export function headerLine(ext, year) {
  const text = `Copyright (c) ${year} ${OWNER}. ${LICENSE_NOTE}`;
  if (ext === ".md") return `<!-- ${text} -->`;
  if (ext === ".sql") return `-- ${text}`;
  return `// ${text}`;
}

/** Collect every covered file under `dir` (absolute paths), skipping SKIP_DIRS. */
export function collectSources(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectSources(full, out);
    else if (entry.isFile() && isSource(entry.name)) out.push(full);
  }
  return out;
}

/** Run the check over the repo; returns the list of files missing a header. */
export function findMissing(rootDir = ROOT) {
  const missing = [];
  for (const f of collectSources(rootDir)) {
    let content;
    try {
      content = readFileSync(f, "utf8");
    } catch {
      continue;
    }
    if (!fileHasHeader(content)) missing.push(relative(rootDir, f).replace(/\\/g, "/"));
  }
  return missing;
}

const rule = {
  id: "ip-headers",
  label: "R12 ip-headers: every source and docs file carries the copyright header",
  async run({ fail, ok }) {
    const missing = findMissing();
    if (missing.length === 0) {
      ok(`R12 ip-headers: every covered file carries the "${OWNER}" header`);
      return;
    }
    for (const m of missing) {
      fail(`R12 ip-headers: ${m} has no "Copyright (c) <year> ${OWNER}" header. Run \`npm run headers:fix\`.`);
    }
  },
};

export default rule;

// ---------- CLI ----------

const isMain = process.argv[1]?.endsWith("29-ip-headers.mjs");

if (isMain && process.argv.includes("--self-test")) {
  runSelfTest();
} else if (isMain) {
  // Standalone `npm run headers:check`: print and exit non-zero on any miss.
  let failures = 0;
  await rule.run({
    fail: (m) => {
      console.error(`x  ${m}`);
      failures++;
    },
    ok: (m) => console.log(`ok  ${m}`),
  });
  process.exit(failures > 0 ? 1 : 0);
}

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
  expect("isSource true for .md", isSource("README.md"), true);
  expect("isSource true for .sql", isSource("foo.sql"), true);
  expect("isSource false for .json", isSource("package.json"), false);
  expect(
    "fileHasHeader true for js header",
    fileHasHeader("// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed.\nimport x"),
    true,
  );
  expect(
    "fileHasHeader true for md header",
    fileHasHeader("<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->\n\n# Title"),
    true,
  );
  expect(
    "fileHasHeader true past frontmatter",
    fileHasHeader("---\nname: x\ndescription: y\n---\n<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->\n# Body"),
    true,
  );
  expect(
    "fileHasHeader false for no header",
    fileHasHeader("# Title\n\nsome prose with no header"),
    false,
  );
  expect(
    "fileHasHeader false for wrong owner",
    fileHasHeader("<!-- Copyright (c) 2026 Someone Else. MIT. -->\n"),
    false,
  );
  expect("stripFrontmatter removes the block", stripFrontmatter("---\na: 1\n---\nbody"), "body");
  expect("stripFrontmatter no-op without block", stripFrontmatter("# just a doc"), "# just a doc");
  expect("headerLine js style", headerLine(".mjs", 2026), "// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed.");
  expect("headerLine md style", headerLine(".md", 2026), "<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->");
  expect("headerLine sql style", headerLine(".sql", 2026), "-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed.");

  process.stdout.write(`\nself-test: ${pass} passed, ${failc} failed\n`);
  process.exit(failc > 0 ? 3 : 0);
}
