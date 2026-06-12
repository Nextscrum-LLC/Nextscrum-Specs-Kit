<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# Post-mortem <YYYY-MM-DD> - <short title>

## What happened

<Plain narrative of the failure. What broke, when it was noticed, how.>

## Impact

<Who or what was affected, and how badly. Be concrete (time lost, scope, blast
radius).>

## Root cause

<The actual cause, not the symptom. Keep asking "why" until you reach a cause
that a guard could catch. Distinguish the trigger from the underlying weakness.>

## What made it hard to catch

<Why the existing rails did not stop it. This is the most useful section: it
tells you where the gap in enforcement is.>

## The rule change (the whole point)

- <The concrete guard added: a new `scripts/rules/*.mjs` check, a husky hook
  change, a trigger-map entry, a test. Reference the commit.>
- <If no machine guard is possible, say so explicitly and explain why, so the
  residual risk is on the record.>

## References

- <links to the commit, the ledger entry, the spec, the session log>
