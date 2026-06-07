// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/rules/06a-em-dashes.mjs
//
// No em dashes in user-facing files. We exclude code comments
// (// and <!-- -->) and block comments before scanning.
//
// RESKIN: set USER_FACING_DIRS / USER_FACING_FILES per project. The
// mechanism (strip comments, then look for the em dash glyph) is
// stack-neutral; only the scan scope is project-specific.

import { readFileSync } from "node:fs";
import { relative, resolve, join } from "node:path";
import { ROOT, walk } from "./_shared.mjs";

// RESKIN: directories whose .html/.css/.md content is user-facing.
const USER_FACING_DIRS = [
  { dir: join(ROOT, "docs"), exts: [".md"], ignore: ["node_modules", "sessions"] },
  // RESKIN: add your UI source dir here, e.g.
  // { dir: join(ROOT, "<UI_GLOB>"), exts: [".html", ".css"], ignore: ["node_modules"] },
];

// RESKIN: individual root files that ship under NextScrum's name.
const USER_FACING_FILES = [
  resolve(ROOT, "README.md"),
];

const EM_DASH = "—";

export default {
  id: "r6-em-dashes",
  label: "voice: no em dashes in user-facing files",
  async run({ fail, ok }) {
    const userFacingFiles = [
      ...USER_FACING_DIRS.flatMap((d) => walk(d.dir, d.exts, d.ignore)),
      ...USER_FACING_FILES,
    ];
    let hits = 0;
    for (const f of userFacingFiles) {
      let text;
      try {
        text = readFileSync(f, "utf8");
      } catch {
        continue; // file may not exist in a fresh kit; skip silently
      }
      const stripped = text
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      if (stripped.includes(EM_DASH)) {
        fail(`R1 no-em-dash: em dash in user-facing file: ${relative(ROOT, f)}`);
        hits++;
      }
    }
    if (hits === 0) ok("R1 no-em-dash: no em dashes in user-facing files");
  },
};
