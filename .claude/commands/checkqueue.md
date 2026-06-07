---
description: Show open errors in docs/error-queue.md and offer to address them. Run any time, automatically run at session start per CLAUDE.md.
---
<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

Read `docs/error-queue.md`. Parse the `## Open entries` section.

If empty / "(none - queue is clean)":
- Reply: "Error queue is clean - no open entries."
- Stop.

If there are open entries:
1. Summarize them in a small table with columns: severity, count, key, last-seen, what-happened.
2. Sort by severity (critical → high → medium → low) then by count DESC.
3. Show the highest-severity entry's full body (severity, count, context, suggested fix).
4. Ask the user: "Address these now? (yes / skip / triage)"
   - **yes** → open the highest-severity entry, walk through the suggested fix, apply, then mark it resolved in the queue (via the project's error-queue helper or a quick one-liner) when done.
   - **triage** → walk through them one at a time, asking per entry.
   - **skip** → reply "ok, deferring", note in current session log.

When applying a fix:
- Find the file:line referenced in `suggestedFix` (if any)
- Read the surrounding code
- Propose the change; show the diff before applying
- After change is in, run the project's lint + test commands to verify nothing broke
- Mark resolved in the queue with the project's `markResolved("<key>", "<one-line resolution + optional commit SHA>")` helper

Resolution note format: `commit <SHA> - <one line>` if there's a commit, or just `<one line>` if it was an investigation that concluded "wont-fix" or "false alarm."

Don't auto-fix without showing the diff first. The user reviews every change.
