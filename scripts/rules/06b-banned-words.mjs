// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/rules/06b-banned-words.mjs
//
// Banned-word list in user-facing HTML / markdown text. Strips
// script/style/comment/fenced-code blocks before scanning so we only
// check what the reader actually sees.
//
// RESKIN: set USER_FACING_DIRS / USER_FACING_FILES per project (same
// scope as 06a). Extend `bannedWords` with any project-specific terms.

import { readFileSync } from "node:fs";
import { relative, resolve, join } from "node:path";
import { ROOT, walk } from "./_shared.mjs";

const bannedWords = [
  "delve", "tapestry", "leverage", "seamless", "robust",
  "comprehensive", "synergy", "best-in-class", "cutting-edge",
  "world-class", "spearhead", "pivotal", "landscape", "realm",
  "embark", "elevate", "harness", "optimize",
];
const bannedRe = new RegExp(`\\b(${bannedWords.join("|")})\\b`, "gi");

// RESKIN: directories whose .html/.md content is user-facing.
const USER_FACING_DIRS = [
  { dir: join(ROOT, "docs"), exts: [".md"], ignore: ["node_modules", "sessions"] },
  // RESKIN: add your UI source dir here, e.g.
  // { dir: join(ROOT, "<UI_GLOB>"), exts: [".html"], ignore: ["node_modules"] },
];

// RESKIN: individual root files that ship under NextScrum's name.
const USER_FACING_FILES = [
  resolve(ROOT, "README.md"),
];

export default {
  id: "r6-banned-words",
  label: "voice: no banned words in user-facing files",
  async run({ fail, ok }) {
    const userFacingFiles = [
      ...USER_FACING_DIRS.flatMap((d) => walk(d.dir, d.exts, d.ignore)),
      ...USER_FACING_FILES,
    ];
    let hits = 0;
    for (const f of userFacingFiles) {
      if (!f.endsWith(".html") && !f.endsWith(".md")) continue;
      let text;
      try {
        text = readFileSync(f, "utf8");
      } catch {
        continue;
      }
      const visible = text
        .replace(/<script[\s\S]*?<\/script>/g, "")
        .replace(/<style[\s\S]*?<\/style>/g, "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/```[\s\S]*?```/g, "");
      bannedRe.lastIndex = 0;
      let m;
      while ((m = bannedRe.exec(visible)) !== null) {
        fail(`R2 no-banned-words: banned word "${m[1]}" in ${relative(ROOT, f)}`);
        hits++;
        if (hits > 20) break;
      }
    }
    if (hits === 0) ok("R2 no-banned-words: no banned words in user-facing files");
  },
};
