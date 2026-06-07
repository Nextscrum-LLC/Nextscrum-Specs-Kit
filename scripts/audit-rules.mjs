// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/audit-rules.mjs
//
// Thin runner for the locked-rule checks. Each check lives as its own
// module under scripts/rules/<NN-name>.mjs and exports a default
// object with shape `{ id, label, run({ fail, ok, warn }) }`.
//
// Usage:
//   npm run audit:rules
//   node scripts/audit-rules.mjs
//
// Order: filename alphabetical. Files starting with `_` are skipped
// (helpers). To add a new rule, drop a new file under scripts/rules/
// with the next free numeric prefix and the same export shape.

import { readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RULES_DIR = resolve(__dirname, "rules");

let failures = 0;
const fail = (msg) => { console.error(`x  ${msg}`); failures++; };
const ok   = (msg) => { console.log(`ok  ${msg}`); };
const warn = (msg) => { console.warn(`!  ${msg}`); };

const ruleFiles = readdirSync(RULES_DIR)
  .filter((f) => f.endsWith(".mjs") && !f.startsWith("_"))
  .sort();

for (const file of ruleFiles) {
  let mod;
  try {
    mod = await import(`file://${join(RULES_DIR, file).replace(/\\/g, "/")}`);
  } catch (e) {
    fail(`could not load rule module ${file}: ${e.message}`);
    continue;
  }
  const rule = mod.default;
  if (!rule || typeof rule.run !== "function") {
    fail(`rule module ${file} is missing default export { id, label, run() }`);
    continue;
  }
  try {
    await rule.run({ fail, ok, warn });
  } catch (e) {
    fail(`${rule.id || file} threw during run(): ${e.message}`);
  }
}

console.log("");
if (failures > 0) {
  console.error(`audit:rules - ${failures} failure(s). Fix and re-run.`);
  process.exit(1);
} else {
  console.log("audit:rules - all checks passed.");
}
