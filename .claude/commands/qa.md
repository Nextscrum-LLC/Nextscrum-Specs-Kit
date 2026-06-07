---
description: Run the full quality gate - formatting, lint, tests, dead-code, IP headers. Pass = safe to commit.
---
<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->


Run these in order, print ✓/✗ for each, refuse to declare green if any failed.

1. **IP headers** - `npm run headers:check`
2. **Format check** - `npm run format:check` (suggest `npm run format` if fails)
3. **Lint** - `npm run lint` (suggest `npm run lint:fix` if fails)
4. **Unit tests** - `npm test` (or the project's unit-test command).
5. **E2E tests** - invoke the `playwright-runner` agent (or run the project's E2E command). Skip with "no E2E suite" if the project has none yet.
6. **Dead code** - `npm run clean:dead` (knip or the project's dead-code tool).
7. **Security audit** - `npm run audit:sec`. Fail on HIGH/CRITICAL.

> RESKIN: Wire each step to this project's real scripts. Drop any step the
> project does not have (for example a project with no E2E suite skips step 5).
> Add a smoke step here if the product has a single-command end-to-end run
> worth gating on.

Final summary table. If all green: "QA green - safe to commit." Otherwise list what failed and the fix command for each. Do NOT auto-fix in QA - that's `/clean`.
