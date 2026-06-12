// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/rules/27-platform-limitation-refs.mjs
//
// R10 (platform-limitation registry) integrity, warn-level. Two gaps it
// surfaces:
//   1. A `PL-NNN` reference anywhere in docs/ that does not resolve to a
//      docs/platform-limitations/PL-NNN-*.md detail file (a dangling ref).
//   2. A PL detail file that exists but is not listed in the registry index
//      (docs/platform-limitations/README.md), so the index has drifted.
//
// WARNS rather than fails: the kit ships the registry empty, and a record can
// land in one commit with its inbound links in the next. The warning is the
// reminder; the human decides.
//
// Self-test:  node scripts/rules/27-platform-limitation-refs.mjs --self-test

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, walk } from "./_shared.mjs";

const PL_DIR = join(ROOT, "docs", "platform-limitations");
const DOCS_DIR = join(ROOT, "docs");
// A reference / id token: PL- followed by 3+ digits (matches the zero-padded
// PL-001 filename scheme; ignores the non-digit "PL-NNN" placeholder in prose).
const PL_TOKEN = /PL-\d{3,}/g;
// A detail file: PL-NNN-<slug>.md (README.md is the index, not a record).
const PL_FILE = /^PL-(\d{3,})-[^/]*\.md$/;

/** Detail-file basenames -> the set of declared PL ids (e.g. "PL-001"). */
export function declaredIds(basenames) {
  const ids = new Set();
  for (const name of basenames) {
    const m = name.match(PL_FILE);
    if (m) ids.add(`PL-${m[1]}`);
  }
  return ids;
}

/** Every PL id token referenced in a blob of text. */
export function referencedIds(text) {
  return new Set(text.match(PL_TOKEN) || []);
}

/** Referenced ids with no declared detail file (dangling). */
export function danglingRefs(referenced, declared) {
  return [...referenced].filter((id) => !declared.has(id)).sort();
}

/** Declared detail files whose id never appears in the index text. */
export function unindexedIds(declared, indexText) {
  const inIndex = referencedIds(indexText);
  return [...declared].filter((id) => !inIndex.has(id)).sort();
}

export default {
  id: "platform-limitation-refs",
  label: "platform-limitation-refs: PL-NNN references resolve + index in sync (warn)",
  async run({ ok, warn }) {
    let detailFiles;
    try {
      detailFiles = walk(PL_DIR, [".md"], ["node_modules"])
        .map((p) => p.split(/[\\/]/).pop())
        .filter((n) => PL_FILE.test(n));
    } catch {
      ok("platform-limitation-refs: no registry folder, nothing to check");
      return;
    }

    const declared = declaredIds(detailFiles);

    // Collect every PL-NNN reference across docs/.
    const referenced = new Set();
    for (const f of walk(DOCS_DIR, [".md"], ["node_modules"])) {
      let text;
      try {
        text = readFileSync(f, "utf8");
      } catch {
        continue;
      }
      for (const id of referencedIds(text)) referenced.add(id);
    }

    let indexText = "";
    try {
      indexText = readFileSync(join(PL_DIR, "README.md"), "utf8");
    } catch {
      // no index yet; unindexed check becomes a no-op below
    }

    const dangling = danglingRefs(referenced, declared);
    const unindexed = unindexedIds(declared, indexText);

    if (dangling.length === 0 && unindexed.length === 0) {
      ok("platform-limitation-refs: all PL-NNN references resolve; index in sync");
      return;
    }
    for (const id of dangling) {
      warn(`platform-limitation-refs: ${id} is referenced but has no docs/platform-limitations/${id}-*.md detail file. Add the record or fix the reference.`);
    }
    for (const id of unindexed) {
      warn(`platform-limitation-refs: ${id} has a detail file but is not listed in the registry index (docs/platform-limitations/README.md). Add its row.`);
    }
  },
};

// ---------- Self-test ----------

function runSelfTest() {
  let pass = 0,
    failc = 0;
  const expect = (name, actual, expected) => {
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
      pass++;
      process.stdout.write(`  ok ${name}\n`);
    } else {
      failc++;
      process.stdout.write(
        `  x ${name}\n     expected ${JSON.stringify(expected)} got ${JSON.stringify(actual)}\n`,
      );
    }
  };

  process.stdout.write("scripts/rules/27-platform-limitation-refs.mjs self-test\n");

  // declaredIds reads ids from detail filenames, ignores README.
  expect(
    "declaredIds from filenames",
    [...declaredIds(["PL-001-foo.md", "PL-014-bar-baz.md", "README.md"])].sort(),
    ["PL-001", "PL-014"],
  );
  // referencedIds matches PL-NNN tokens, ignores the PL-NNN prose placeholder.
  expect(
    "referencedIds finds digit tokens only",
    [...referencedIds("see PL-001 and PL-014; template uses PL-NNN")].sort(),
    ["PL-001", "PL-014"],
  );
  // dangling: referenced but not declared.
  expect(
    "danglingRefs flags the unmatched ref",
    danglingRefs(new Set(["PL-001", "PL-002"]), new Set(["PL-001"])),
    ["PL-002"],
  );
  expect(
    "danglingRefs empty when all resolve",
    danglingRefs(new Set(["PL-001"]), new Set(["PL-001", "PL-009"])),
    [],
  );
  // unindexed: declared file whose id is absent from the index text.
  expect(
    "unindexedIds flags the missing index row",
    unindexedIds(new Set(["PL-001", "PL-002"]), "index lists PL-001 only"),
    ["PL-002"],
  );
  // empty registry => nothing declared, nothing referenced => clean.
  expect(
    "empty registry is clean",
    danglingRefs(referencedIds("only PL-NNN placeholders here"), declaredIds(["README.md"])),
    [],
  );

  process.stdout.write(`\nself-test: ${pass} passed, ${failc} failed\n`);
  process.exit(failc > 0 ? 3 : 0);
}

const isMain = process.argv[1]?.endsWith("27-platform-limitation-refs.mjs");
if (isMain && process.argv.includes("--self-test")) runSelfTest();
