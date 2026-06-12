---
description: Auto-clean - format, lint:fix, dead-code removal, dependency hygiene. Apply fixes; do NOT run if branch is dirty without explicit confirmation.
---
<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->


This skill modifies files. Refuse to run if `git status` shows uncommitted changes UNLESS the user explicitly says "yes, run clean on dirty tree."

> RESKIN: the `npm run ...` scripts below are project-supplied. Wire them in your
> `package.json` (or adapt the step to your toolchain) and drop any that do not apply.

Steps:

1. **Auto-format** - `npm run format`
2. **Auto-lint-fix** - `npm run lint:fix`
3. **Add missing IP headers** - `npm run headers:fix` backfills the copyright header on any code or docs file missing it (R12). Run `npm run headers:check` first to see what is missing.
4. **Dead-code report** - `npm run clean:dead` (knip or the project's dead-code tool). DON'T auto-delete; print findings and let the user confirm each removal.
5. **Unused dependency report** - knip also flags unused npm deps. Same: print, confirm before removal.
6. **Show the diff** - `git diff --stat` after all changes. Pause for the user to review before they commit.

Never delete files without explicit per-file confirmation. Always show what changed before suggesting a commit message.

If the user says "yes commit" after reviewing, suggest:
```
chore(clean): apply prettier, eslint --fix, and IP header backfill
```
or for dead-code removal:
```
chore(clean): remove unused exports flagged by knip
```
