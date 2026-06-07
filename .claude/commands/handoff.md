---
description: Save current state to HANDOFF.md and append a session log before /compact
---
<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->


You are wrapping up a Claude Code session. Do these steps in order:

1. Read the current HANDOFF.md.
2. Update the **Done**, **In progress**, **To do**, **Gotchas**, and **Open questions** sections to reflect work completed this session.
3. Update the "Last updated" date and "Branch" line at the top.
4. Generate a new session log file at `docs/sessions/YYYY-MM-DD-NN.md` (figure out NN by listing existing files for today). The session log should include:
   - Goal of this session (from the user's first message or HANDOFF)
   - Key decisions made (with one-line reasoning each)
   - Files created or modified (with one-line purpose each)
   - Open questions for next session
   - Any gotchas discovered
5. Stage the changes (`git add -A`) but DO NOT commit yet - show the user the staged diff and let them write the commit message (or approve a suggested one).
6. After commit, print a one-paragraph summary of where the project stands and what the next session should pick up.

Do not run `/compact` itself. The user will run it after reviewing the handoff.
