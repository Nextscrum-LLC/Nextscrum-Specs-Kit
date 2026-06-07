// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/rules/90-doc-orphans.mjs
//
// Doc-orphan check (warn-only). Reports .md files with zero inbound
// links from other .md files. Warn-only by design: a doc may land in
// commit N and its inbound links in commit N+1, which is legitimate.
// Implementation in scripts/check-doc-orphans.mjs (with --self-test).
//
// File-numbered 90 so it sorts after the R-NNN rules. Doc hygiene is
// auxiliary, not a locked rule.

import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  id: "doc-orphans",
  label: "doc-orphans (warn-only)",
  async run({ ok, warn }) {
    try {
      const result = spawnSync(process.execPath, [
        resolve(__dirname, "..", "check-doc-orphans.mjs"),
      ], { encoding: "utf8" });
      const out = (result.stdout || "").trim();
      if (out.startsWith("ok")) {
        ok(out.split("\n")[0].replace(/^ok\s+/, ""));
      } else if (out.startsWith("!")) {
        warn(out.split("\n")[0].replace(/^!\s+/, ""));
        const lines = out.split("\n").slice(1);
        for (const line of lines) {
          if (line.trim()) console.warn(`     ${line.replace(/^\s*/, "")}`);
        }
      }
    } catch (e) {
      warn(`doc-orphans: could not run (${e.message})`);
    }
  },
};
