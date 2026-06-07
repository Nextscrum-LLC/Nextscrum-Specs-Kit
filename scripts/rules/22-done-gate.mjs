// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/rules/22-done-gate.mjs
//
// done-gate: ledger done-gate. Refuses commit if any docs/requirements.md
// entry marked status: done has Verified by below NextScrum-manual.
// Implementation in scripts/check-ledger-done-gate.mjs (with
// --self-test). This thin shim calls that script as a subprocess and
// surfaces its output through the runner's ok/fail channels.

import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  id: "r22-done-gate",
  label: "done-gate: ledger done-gate",
  async run({ fail, ok, warn }) {
    try {
      const result = spawnSync(process.execPath, [
        resolve(__dirname, "..", "check-ledger-done-gate.mjs"),
      ], { encoding: "utf8" });
      if (result.status === 0) {
        if (result.stdout.trim()) {
          const line = result.stdout.trim().split("\n").find((l) => l.includes("done-gate"))
            || result.stdout.trim().split("\n")[0];
          ok(line.replace(/^ok\s+/, ""));
        } else {
          ok("R6 done-gate: ledger done-gate clean");
        }
      } else {
        fail("R6 done-gate: ledger done-gate failure (see check-ledger-done-gate.mjs output above)");
        if (result.stderr.trim()) console.error(result.stderr);
      }
    } catch (e) {
      warn(`R6 done-gate: could not run ledger done-gate check (${e.message})`);
    }
  },
};
