<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# Agent invocation telemetry

> Append-only log of every dev-workflow-agent run. Used to reason about how often
> each agent fires, what verdicts dominate, and whether the review-marker trigger
> map (R5) is well-calibrated. Opt-in: nothing is logged until the main session
> calls the writer after an agent run. The log lives at `docs/agent-telemetry.jsonl`
> (gitignored; it is per-fork runtime data, not part of the kit).

## Why this exists

The seven dev-workflow agents (chain-tracer, code-reviewer, db-reviewer,
requirements-ledger, handoff-writer, mockup-checker, playwright-runner) are
invoked by hand, driven by the review-marker trigger map in
`.claude/rules/engineering.md`. Without a record of when each agent ran and what
it found, there is no way to tune the trigger map or weigh an agent's cost
against its catches. This log makes invocations auditable after the fact.

## File format

JSONL (newline-delimited JSON). Each line is one self-contained event:

```jsonc
{
  "ts":          "2026-06-12T01:43:00.000Z", // ISO 8601 UTC (auto-stamped)
  "agent":       "chain-tracer",              // one of the seven agent names
  "verdict":     "PASS",                      // agent-specific token (1-80 chars)
  "duration_ms": 12000,                       // wall-clock runtime
  "commit":      "staged",                    // short SHA or "staged"
  "context":     "SPEC-001 export route",     // what was reviewed (1-200 chars)
  "notes":       "8 hops traced end to end"   // optional (up to 800 chars)
}
```

## How to write a line

After a sub-agent run, the main session calls:

```bash
node scripts/log-agent-invocation.mjs \
  --agent chain-tracer \
  --verdict PASS \
  --duration-ms 12000 \
  --commit staged \
  --context "SPEC-001 export route" \
  --notes "8 hops traced end to end"
```

The writer validates the input (rejects unknown agents, negative durations,
over-length strings) and refuses to write a malformed event. A telemetry failure
returns a non-zero exit but never throws into the calling flow, so a logging
problem can never break a commit.

## Reading it back

Because each line is plain JSON, ordinary tools answer the useful questions:

```bash
# how many times each agent ran
cat docs/agent-telemetry.jsonl | jq -r .agent | sort | uniq -c

# every BLOCK / FAIL verdict, newest last
cat docs/agent-telemetry.jsonl | jq -c 'select(.verdict | test("BLOCK|FAIL"))'
```

A run of mostly-PASS verdicts for an agent that fires on every commit is a signal
the trigger map is too broad; a string of BLOCKs on one path is a signal that
path needs a structural fix, not repeated review.
