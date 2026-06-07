# Session logs

One file per working session, named `YYYY-MM-DD-NN-short-title.md` (NN is the
session number that day). Written or updated by the `handoff-writer` agent
before a `/compact` or at the end of a session.

Purpose: the next session (you, tomorrow, or a teammate) can pick up exactly
where this one left off without re-deriving context. A session log is not a
changelog; git is the changelog. A session log captures intent, open threads,
and the decisions that have not yet made it into an ADR.

Use `TEMPLATE.md` to start a new one. Keep the most recent few; archive the rest.
The session protocol in `CLAUDE.md` says to read the most recent session log at
the start of every session, so keep the latest one current.
