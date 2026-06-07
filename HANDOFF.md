# HANDOFF

The across-session state file. The `handoff-writer` agent updates this before a
context compaction or at the end of a session, and the next session reads it
first (see the session protocol in `CLAUDE.md`). Git is the changelog; this file
carries intent, open threads, and decisions that have not yet become an ADR.

> This is a fresh template. Replace the placeholders below as you work.

## Current focus

<One or two sentences: what is being worked on right now.>

## State of the rails

- `npm run audit:rules`: <green / what is failing>
- `npm test`: <green / what is failing>
- ledger: <entries in progress, entries awaiting verification>

## Open threads (start here next session)

- [ ] <the next concrete action, specific enough to start cold>
- [ ] <blocked item + what it is blocked on>

## Decisions not yet recorded

- <one-line notes on decisions that should become an ADR in docs/decisions/>
