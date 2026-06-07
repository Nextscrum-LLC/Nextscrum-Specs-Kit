// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/rules/21-marker-surface.mjs
//
// review-markers: surface required review markers at pre-commit time.
//
// audit:rules runs BEFORE the commit message exists, so we can't
// verify markers are present yet. Instead, we print which markers
// WILL be required so the author sees them while drafting the
// message. The hard block lives in .husky/commit-msg, which calls
// scripts/check-review-markers.mjs against the staged file set.

import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  id: "r21-marker-surface",
  label: "review-markers: surface required review markers",
  async run({ ok, warn }) {
    try {
      const stagedOut = execSync("git diff --cached --name-only", {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      const staged = stagedOut.split("\n").filter(Boolean);
      if (staged.length === 0) return; // nothing staged, nothing to surface
      const checkerPath = resolve(__dirname, "..", "check-review-markers.mjs");
      const { computeRequiredMarkers } = await import(
        `file://${checkerPath.replace(/\\/g, "/")}`
      );
      const required = computeRequiredMarkers(staged);
      if (required.size === 0) {
        ok("R5 review-markers: no review markers required for this change");
      } else {
        const list = [...required.keys()].map((m) => `[${m}]`).join(", ");
        ok(`R5 review-markers: this commit MUST include the marker(s) in its message body: ${list}`);
        console.log("       (commit-msg hook will block the commit if any are missing)");
      }
    } catch (e) {
      warn(`R5 review-markers: could not compute required markers (${e.message})`);
    }
  },
};
