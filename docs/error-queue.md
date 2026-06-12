<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# Error queue

A lightweight running list of known errors and rough edges that are not yet
their own spec or issue. The `/checkqueue` command reads this file and offers to
address open entries. Keep it short; promote anything real to a ledger entry in
`requirements.md` or a GitHub issue.

## Open entries

(none)

## Format

Each entry is a single block:

```
### <short title>
- status: open | resolved | wont-fix
- seen: <where it shows up>
- note: <what is known so far>
```
