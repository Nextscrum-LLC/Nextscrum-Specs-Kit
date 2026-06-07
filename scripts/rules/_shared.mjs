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
