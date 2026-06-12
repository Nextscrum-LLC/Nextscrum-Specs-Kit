// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/add-ip-headers.mjs
//
// Idempotent fixer for R12 (ip-headers): prepends the copyright header to every
// source file that is missing it. Safe to re-run. Shares its config (OWNER,
// LICENSE_NOTE, the extension and skip sets) with the check in
// scripts/rules/29-ip-headers.mjs, so the two never drift.
//
// Usage:  npm run headers:fix   (or: node scripts/add-ip-headers.mjs)

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, extname, relative } from "node:path";
import {
  OWNER,
  SKIP_DIRS,
  isSource,
  hasHeader,
  headerLine,
} from "./rules/29-ip-headers.mjs";
import { ROOT } from "./rules/_shared.mjs";

const YEAR = new Date().getFullYear();

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
  const head = content.split("\n").slice(0, 5).join("\n");
  if (hasHeader(head)) {
    stats.alreadyOk++;
    return;
  }

  const line = headerLine(extname(filePath), YEAR) + "\n";
  let next;
  // Preserve a leading shebang so the header lands on line 2.
  if (content.startsWith("#!")) {
    const nl = content.indexOf("\n");
    next = content.slice(0, nl + 1) + line + content.slice(nl + 1);
  } else {
    next = line + content;
  }
  writeFileSync(filePath, next, "utf8");
  stats.added.push(relative(ROOT, filePath).replace(/\\/g, "/"));
}

walk(ROOT);

console.log(`[headers:fix] added header to ${stats.added.length} file(s)`);
for (const f of stats.added) console.log(`  + ${f}`);
console.log(`[headers:fix] already had header: ${stats.alreadyOk}`);
if (stats.added.length === 0) console.log("[headers:fix] nothing to do; all source files compliant");
