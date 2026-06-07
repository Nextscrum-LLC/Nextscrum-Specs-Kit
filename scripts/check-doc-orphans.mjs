#!/usr/bin/env node
// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/check-doc-orphans.mjs
//
// Warn-level check: lists .md files with zero inbound links from any
// other .md file. A contributor can drop a doc in a corner of the repo
// and forget to link it from anywhere; the doc-chain breaks silently.
// This script makes those orphans visible at every audit:rules run.
//
// Warn-only by design. Sometimes a doc lands in one commit and its
// inbound links land in the next; we don't want to block legitimate work.
//
// Allowlist (these are allowed to have zero inbound links):
//   - Root entry points (auto-loaded by tools / GitHub regardless of links)
//   - docs/sessions/*.md (archival; date-ordered; intentionally flat)
//   - Per-folder README.md (auto-discoverable when entering the folder)
//   - RESKIN: add any project-specific auto-loaded doc locations.
//
// Usage:
//   node scripts/check-doc-orphans.mjs
//   node scripts/check-doc-orphans.mjs --self-test
//
// Exit codes:
//   0 = always (warn-only)
//   3 = self-test failure

import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, relative, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Allowed-to-be-orphaned patterns. Match against the path relative to
// the repo root, forward-slash separated.
// RESKIN: prune or extend these to match your repo's auto-loaded docs.
const ALLOW_ORPHAN_PATTERNS = [
  // Root entry points (auto-loaded by tools / GitHub)
  /^CLAUDE\.md$/,
  /^README\.md$/,
  /^AGENTS\.md$/,
  /^HANDOFF\.md$/,
  /^CONTRIBUTING\.md$/,
  /^LICENSE(\.md)?$/,
  // GitHub auto-loaded
  /^\.github\//,
  // Tooling-discovered command / skill / rule files (not prose docs)
  /^\.claude\/commands\//,
  /^\.claude\/skills\//,
  /^\.claude\/rules\//,
  // Husky internal
  /^\.husky\/_\//,
  // Archival session logs (date-ordered, intentionally flat)
  /^docs\/sessions\/\d{4}-\d{2}-\d{2}-/,
  /^docs\/sessions\/TEMPLATE\.md$/,
  // Docs-site config files (consumed at runtime, not prose)
  /^docs\/_[A-Za-z0-9-]+\.md$/,
  // node_modules
  /\/node_modules\//,
];

const IGNORE_DIRS = new Set([
  ".git", "node_modules", ".husky", ".vscode", "playwright-report",
  "test-results", "coverage", "dist", "build",
]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full, out);
    else if (entry.endsWith(".md")) out.push(full);
  }
  return out;
}

/**
 * Find all .md files under root and return their paths relative to
 * the repo root, forward-slash style.
 */
function findAllMdFiles(rootAbs) {
  const all = walk(rootAbs);
  return all.map((p) => relative(rootAbs, p).split(/[\\/]/).join("/"));
}

/**
 * Determine inbound count for each .md file by scanning every OTHER
 * .md file's content.
 *
 * Match rules (intentionally specific to avoid false positives):
 *   - Always: full repo-root path appears in `other` content
 *   - For non-README files: basename appears in `other` content
 *   - For README files: skip basename match (too noisy because every
 *     README mentions the word "README.md" in its own prose), but
 *     count the parent-folder reference (e.g., "docs/architecture/")
 *     which markdown renderers resolve to the README
 *
 * Returns Map<path, inbound count>.
 */
export function computeInboundCounts(allMdPaths, fileReader) {
  const inbound = new Map();
  for (const p of allMdPaths) inbound.set(p, 0);

  // Pre-compute each file's content once.
  const contents = new Map();
  for (const p of allMdPaths) {
    try {
      contents.set(p, fileReader(p));
    } catch {
      contents.set(p, "");
    }
  }

  for (const p of allMdPaths) {
    const base = basename(p);
    const folder = dirname(p); // e.g., "docs/architecture"
    const isReadme = base.toLowerCase() === "readme.md";

    for (const other of allMdPaths) {
      if (other === p) continue;
      const otherContent = contents.get(other) || "";

      // 1. Full path match (most precise, fewest false positives)
      if (otherContent.includes(p)) {
        inbound.set(p, (inbound.get(p) || 0) + 1);
        continue;
      }

      // 2. Folder-link resolution applies ONLY to README files.
      //    Renderers resolve `docs/foo/` to `docs/foo/README.md`.
      if (isReadme && folder !== "." && folder.length > 0) {
        const folderRef = folder.endsWith("/") ? folder : folder + "/";
        if (otherContent.includes(folderRef)) {
          inbound.set(p, (inbound.get(p) || 0) + 1);
          continue;
        }
      }

      // 3. For non-README files, basename match catches relative links
      //    like `[doc](other-doc.md)`. Skipped for README because every
      //    README's own header mentions "README.md".
      if (!isReadme && otherContent.includes(base)) {
        inbound.set(p, (inbound.get(p) || 0) + 1);
        continue;
      }
    }
  }
  return inbound;
}

function isAllowedOrphan(path) {
  return ALLOW_ORPHAN_PATTERNS.some((re) => re.test(path));
}

export function findOrphans(allMdPaths, inboundMap) {
  const orphans = [];
  for (const p of allMdPaths) {
    if (isAllowedOrphan(p)) continue;
    if ((inboundMap.get(p) || 0) === 0) {
      orphans.push(p);
    }
  }
  return orphans;
}

function main(args) {
  if (args.includes("--self-test")) return runSelfTest();

  const all = findAllMdFiles(ROOT);
  const inbound = computeInboundCounts(all, (p) =>
    readFileSync(resolve(ROOT, p), "utf8")
  );
  const orphans = findOrphans(all, inbound);

  const totalDocs = all.length;
  const checkedCount = all.filter((p) => !isAllowedOrphan(p)).length;

  if (orphans.length === 0) {
    process.stdout.write(`ok  doc-orphans: 0 of ${checkedCount} non-allowlisted .md files are orphaned (${totalDocs} total scanned)\n`);
    process.exit(0);
  }

  process.stdout.write(`!  doc-orphans: ${orphans.length} of ${checkedCount} non-allowlisted .md file(s) have ZERO inbound links\n`);
  for (const o of orphans) {
    process.stdout.write(`     ${o}\n`);
  }
  process.stdout.write("   Add a link from a canonical entry point (CLAUDE.md, docs/README.md, etc.) or move the doc to an allowlisted location (docs/sessions/, etc.). Warn-only; not blocking.\n");
  // Exit 0 because this check is warn-only by design.
  process.exit(0);
}

function runSelfTest() {
  let pass = 0;
  let fail = 0;
  function expect(name, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) { pass++; process.stdout.write(`  ok ${name}\n`); }
    else {
      fail++;
      process.stdout.write(`  x ${name}\n`);
      process.stdout.write(`     expected: ${JSON.stringify(expected)}\n`);
      process.stdout.write(`     actual:   ${JSON.stringify(actual)}\n`);
    }
  }

  process.stdout.write("scripts/check-doc-orphans.mjs self-test\n");

  // Inbound counting
  const files = ["a.md", "b.md", "c.md", "docs/readme.md", "docs/sub/README.md", "x/README.md"];
  const reader = (p) => ({
    "a.md": "links to [b](b.md) and to docs/sub/",
    "b.md": "no links here",
    "c.md": "links to a.md only",
    "docs/readme.md": "this readme links to a.md and b.md",
    "docs/sub/README.md": "this README.md mentions README.md (own header noise)",
    "x/README.md": "lone README.md no inbound (zero refs from elsewhere)",
  }[p] || "");
  const inb = computeInboundCounts(files, reader);
  expect("a.md inbound = 2 (from c.md, docs/readme.md)", inb.get("a.md"), 2);
  expect("b.md inbound = 2 (from a.md, docs/readme.md)", inb.get("b.md"), 2);
  expect("c.md inbound = 0 (no one links to it)", inb.get("c.md"), 0);
  expect("docs/sub/README.md inbound = 1 (folder ref from a.md)", inb.get("docs/sub/README.md"), 1);
  expect("x/README.md inbound = 0 (no folder or path ref; basename-match disabled for READMEs)", inb.get("x/README.md"), 0);

  // Allowlist
  expect("CLAUDE.md is allowed-orphan", isAllowedOrphan("CLAUDE.md"), true);
  expect("HANDOFF.md is allowed-orphan", isAllowedOrphan("HANDOFF.md"), true);
  expect("docs/sessions/2026-05-17-foo.md is allowed-orphan", isAllowedOrphan("docs/sessions/2026-05-17-foo.md"), true);
  expect(".github/PULL_REQUEST_TEMPLATE.md is allowed-orphan", isAllowedOrphan(".github/PULL_REQUEST_TEMPLATE.md"), true);
  expect(".claude/commands/qa.md is allowed-orphan (command)", isAllowedOrphan(".claude/commands/qa.md"), true);
  expect(".claude/rules/engineering.md is allowed-orphan (path-scoped rule)", isAllowedOrphan(".claude/rules/engineering.md"), true);
  expect("docs/_sidebar.md is allowed-orphan (docs-site config)", isAllowedOrphan("docs/_sidebar.md"), true);
  expect("docs/random.md is NOT allowed-orphan", isAllowedOrphan("docs/random.md"), false);
  expect("scripts/foo.md is NOT allowed-orphan", isAllowedOrphan("scripts/foo.md"), false);

  // findOrphans applies allowlist
  const files2 = ["c.md", "CLAUDE.md", "scripts/notes.md"];
  const inb2 = new Map([["c.md", 0], ["CLAUDE.md", 0], ["scripts/notes.md", 0]]);
  const orphans2 = findOrphans(files2, inb2);
  expect("orphans skip CLAUDE.md (entry point)", orphans2.includes("CLAUDE.md"), false);
  expect("orphans include scripts/notes.md", orphans2.includes("scripts/notes.md"), true);
  expect("orphans include c.md", orphans2.includes("c.md"), true);

  process.stdout.write(`\nself-test: ${pass} passed, ${fail} failed\n`);
  if (fail > 0) process.exit(3);
  process.exit(0);
}

const isMain = process.argv[1]?.endsWith("check-doc-orphans.mjs");
if (isMain) main(process.argv.slice(2));
