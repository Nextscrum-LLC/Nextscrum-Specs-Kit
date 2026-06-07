<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# SPEC-000: Tasks (work units)

> Each task is a child of SPEC-000 and inherits its number. Build order
> matters: the CSV encoder is the foundation the route depends on.

| Task | Scope | Marker | Satisfies | Status |
|---|---|---|---|---|
| T1 | `src/lib/csv.js`: CSV encoder with standard quoting + the formula-injection guard (escape leading `= + - @`) | none | crit 4 | open |
| T2 | `src/routes/reports.js`: `GET /reports/:reportId/export.csv`; validate `reportId` against the allowlist FIRST; stream rows; set filename + content type; header-only on zero rows | `[chain-tracer-ok]` | crit 1, 2, 3 | open |
| T3 | Report view: Export button wired to the endpoint | `[chain-tracer-ok]` | crit 1 | open |
| T4 | Report view: button idle -> busy -> idle state machine with `aria-busy` and disabled-during-export | none | crit 5 | open |

## Build order

T1 (encoder; pure, unit-testable in isolation) -> T2 (route uses the
encoder; the security validation lands here) -> T3 (button calls the route)
-> T4 (button busy state). Each task is one commit with the test that proves
its acceptance criterion.

> RESKIN: replace file paths with your real layout; the marker column maps
> to your own review-marker rule (R5).
