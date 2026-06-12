// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/add-ip-headers.mjs
//
// Idempotent fixer for R12 (ip-headers): prepends the copyright header to every
// covered file that is missing it. Safe to re-run. Shares its config (OWNER,
// LICENSE_NOTE, the extension and skip sets, the header detection) with the
// check in scripts/rules/29-ip-headers.mjs, so the two never drift.
//
// Code files get a line-comment header at the top (after any shebang). Markdown
// gets an HTML-comment header after any YAML frontmatter block, before the body.
//
// Usage:  npm run headers:fix   (or: node scripts/add-ip-headers.mjs)

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, extname, relative } from "node:path";
import {
  SKIP_DIRS,
  isSource,
  fileHasHeader,
  headerLine,
} from "./rules/29-ip-headers.mjs";
import { ROOT } from "./rules/_shared.mjs";

const YEAR = new Date().getFullYear();
const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;

const stats = { added: [], alreadyOk: 0 };

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && isSource(entry.name)) processFile(full);
  }
}

function processFile(filePath) {
  const content = readFileSync(filePath, "utf8");
  if (fileHasHeader(content)) {
    stats.alreadyOk++;
    return;
  }

  const ext = extname(filePath);
  const line = headerLine(ext, YEAR);
  let next;

  if (ext === ".md") {
    // Insert after a leading frontmatter block, otherwise at the very top.
    const fm = content.match(FRONTMATTER_RE);
    if (fm) {
      next = fm[0] + line + "\n" + content.slice(fm[0].length);
    } else {
      next = line + "\n\n" + content;
    }
  } else if (content.startsWith("#!")) {
    // Preserve a leading shebang so the header lands on line 2.
    const nl = content.indexOf("\n");
    next = content.slice(0, nl + 1) + line + "\n" + content.slice(nl + 1);
  } else {
    next = line + "\n" + content;
  }

  writeFileSync(filePath, next, "utf8");
  stats.added.push(relative(ROOT, filePath).replace(/\\/g, "/"));
}

walk(ROOT);

console.log(`[headers:fix] added header to ${stats.added.length} file(s)`);
for (const f of stats.added) console.log(`  + ${f}`);
console.log(`[headers:fix] already had header: ${stats.alreadyOk}`);
if (stats.added.length === 0) console.log("[headers:fix] nothing to do; all covered files compliant");
