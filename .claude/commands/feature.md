---
description: Start a new feature branch with proper naming + initial commit
argument-hint: [feature-name] [short description]
---
<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->


Start a new feature branch.

Steps:
1. Make sure we're on `dev` and clean. If on `main`, refuse and tell the user to switch.
2. Pull latest: `git pull origin dev`
3. Create branch: `git checkout -b feat/$1` (sanitize the name: lowercase, hyphens only)
4. Update HANDOFF.md: append a new "In progress" entry for this feature.
5. Commit the HANDOFF update with message `chore(handoff): start feat/$1 ($2)`
6. Push the branch: `git push -u origin feat/$1`

If the user provided no arguments, ask for the feature name and one-line description before starting.
