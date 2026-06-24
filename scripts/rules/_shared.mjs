// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/rules/_shared.mjs
//
// Shared helpers for the per-rule check modules. NOT a rule itself
// (filename starts with underscore so the runner skips it).

import { readdirSync, statSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(__dirname, "..", "..");

/**
 * Recursive file walk with no glob / no deps. Returns absolute paths
 * matching any of `exts`, skipping any path component in `ignore`.
 */
export function walk(dir, exts, ignore = []) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (ignore.some((p) => entry === p || entry.startsWith(p))) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walk(full, exts, ignore));
    } else if (exts.some((e) => entry.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Strict mode. The advisory test rules (R8 coverage, R15 regression-on-fix)
 * warn by default and block when this is on. Flip with SPECKIT_STRICT=1.
 */
export function isStrict() {
  return /^(1|true|yes|on)$/i.test(process.env.SPECKIT_STRICT || "");
}

// RESKIN: adjust these to your project's test-file conventions.
const TEST_FILE_RES = [
  /\.(test|spec)\.[cm]?[jt]sx?$/i, // foo.test.ts, bar.spec.mjs
  /(^|\/)(__tests__|tests?|e2e|specs?)\//i, // anything under a tests/ or e2e/ dir
  /_test\.(py|go|rb)$/i, // foo_test.go, foo_test.py
  /(^|\/)test_[^/]+\.py$/i, // test_foo.py
  /Test\.(java|kt|cs)$/, // FooTest.java
  /\.feature$/i, // cucumber/gherkin
];

const CODE_EXTS = new Set([
  ".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".py", ".go", ".rb", ".php",
  ".java", ".cs", ".rs", ".kt", ".swift", ".c", ".cc", ".cpp", ".h", ".hpp",
]);

/** True if a path looks like a test file (one source of truth for R15 + no-shrink). */
export function isTestFile(p) {
  return TEST_FILE_RES.some((re) => re.test(p.replace(/\\/g, "/")));
}

/** True if a path is application/source code (a code extension, not a test, not docs). */
export function isSourceFile(p) {
  const path = p.replace(/\\/g, "/");
  if (isTestFile(path) || path.startsWith("docs/")) return false;
  const dot = path.lastIndexOf(".");
  return dot >= 0 && CODE_EXTS.has(path.slice(dot).toLowerCase());
}
