// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/rules/30-version-sync.mjs
//
// Configurable guard (off by default). Warns when a commit stages "source"
// files but not the project's version file, a reminder that a release probably
// needs a version bump. This is the generic form of the version-bump discipline
// a shipping repo grows; it stays inert until you point it at your project.
//
// RESKIN: set VERSION_FILE (e.g. "package.json", "manifest.json", a plugin
// header file) and SOURCE_PREFIXES (path prefixes whose change implies a bump).
//
// Warn-only: a docs-only or test-only commit legitimately skips the bump. The
// warning is the reminder; the human decides.
//
// Self-test:  node scripts/rules/30-version-sync.mjs --self-test

import { execSync } from "node:child_process";
import { ROOT } from "./_shared.mjs";

// RESKIN: the file whose version field you bump per release. Empty = inert.
export const VERSION_FILE = "";
// RESKIN: a staged path under any of these prefixes implies a version bump is
// due. Empty = inert. Example: ["src/", "app/", "extension/"].
export const SOURCE_PREFIXES = [];

/**
 * Pure core: given the staged paths (and config), return a gap object when
 * source changed without the version file also being staged, else null.
 */
export function bumpGap(staged, versionFile = VERSION_FILE, prefixes = SOURCE_PREFIXES) {
  if (!versionFile || prefixes.length === 0) return null;
  const touchedSource = staged.some((p) => prefixes.some((pre) => p.startsWith(pre)));
  const versionStaged = staged.includes(versionFile);
  return touchedSource && !versionStaged ? { versionFile, prefixes } : null;
}

function git(cmd) {
  return execSync(`git ${cmd}`, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
}

export default {
  id: "version-sync",
  label: "version-sync: source change includes a version bump (warn, configurable)",
  async run({ ok, warn }) {
    if (!VERSION_FILE || SOURCE_PREFIXES.length === 0) {
      ok("version-sync: not configured, nothing to check");
      return;
    }
    let staged;
    try {
      staged = git("diff --cached --name-only")
        .split("\n")
        .filter(Boolean)
        .map((s) => s.replace(/\\/g, "/"));
    } catch {
      ok("version-sync: not a git context, skipped");
      return;
    }
    if (staged.length === 0) {
      ok("version-sync: no staged changes, nothing to check");
      return;
    }
    const gap = bumpGap(staged);
    if (!gap) {
      ok("version-sync: source changes include the version file (or none staged)");
      return;
    }
    warn(
      `version-sync: source under ${gap.prefixes.join(", ")} is staged but ${gap.versionFile} is not. Did you forget to bump the version?`,
    );
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

  process.stdout.write("scripts/rules/30-version-sync.mjs self-test\n");

  // Inert when unconfigured.
  expect("inert with no config", bumpGap(["src/a.js"], "", []), null);
  // Source staged, version file not -> gap.
  expect(
    "source without version -> gap",
    bumpGap(["src/a.js", "README.md"], "package.json", ["src/"]),
    { versionFile: "package.json", prefixes: ["src/"] },
  );
  // Source staged with version file -> no gap.
  expect(
    "source with version -> no gap",
    bumpGap(["src/a.js", "package.json"], "package.json", ["src/"]),
    null,
  );
  // Only docs staged -> no gap.
  expect(
    "docs only -> no gap",
    bumpGap(["docs/readme.md"], "package.json", ["src/"]),
    null,
  );

  process.stdout.write(`\nself-test: ${pass} passed, ${failc} failed\n`);
  process.exit(failc > 0 ? 3 : 0);
}

const isMain = process.argv[1]?.endsWith("30-version-sync.mjs");
if (isMain && process.argv.includes("--self-test")) runSelfTest();
