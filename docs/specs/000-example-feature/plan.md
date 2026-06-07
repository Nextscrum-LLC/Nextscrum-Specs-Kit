<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# SPEC-000: Plan (how to build)

> The build plan for SPEC-000. Delivery policy (branch, commit, version,
> review, QA, deploy) is global; see `docs/SPEC-SYSTEM.md` Section 7.

## Approach

Add a single export endpoint that streams the report's rows as CSV, plus an
Export button on the report view that calls it. The endpoint validates its
inputs first, builds the CSV row by row (so a large report streams rather
than buffering), and neutralizes formula-injection characters per cell. The
button reflects an in-progress state until the download starts.

## Contracts

### Endpoint

```
GET /reports/:reportId/export.csv

  :reportId   matches ^[a-z0-9-]{1,64}$ (allowlist; validated FIRST)
  response    200  Content-Type: text/csv; charset=utf-8
                   Content-Disposition: attachment;
                     filename="report-<reportId>-<YYYY-MM-DD>.csv"
  errors      400  on a reportId that fails the allowlist or contains a
                   path-traversal sequence (no query is run)
```

### CSV shape

- Row 1 is the header (column names in display order).
- One row per report row, same column order as the on-screen table.
- A zero-row report yields the header row only.
- Cell encoding: standard CSV quoting (wrap in `"` when the value contains a
  comma, quote, or newline; double any embedded `"`).
- Formula-injection guard: if a cell value starts with `=`, `+`, `-`, or
  `@`, prefix it with a single quote `'` before CSV quoting (QB-SEC-003).

### Filename

- `report-<reportId>-<YYYY-MM-DD>.csv`, date in the server's date, report id
  already validated by the allowlist (QB-SEC-001 / QB-SEC-002).

### Button state machine

```
idle  ->  busy  ->  idle
```

- Click while `idle` triggers the fetch and moves to `busy` (button
  disabled, `aria-busy=true`).
- Returns to `idle` when the download starts (QB-A11Y-002 / QB-A11Y-003).

## Files to change

- Backend: `src/routes/reports.js` (new export route), `src/lib/csv.js`
  (CSV encoder + formula guard), `src/services/reportQuery.js` (row reader).
- UI: the report view component (Export button + busy state).

> RESKIN: file paths are placeholders; point them at your real layout.

## Facts to Record (update on landing)

- `docs/architecture/example-feature-design.md` (add the export endpoint
  and CSV contract to the design doc).
- `docs/decisions/0002-example-decision.md` only if the export changes a
  recorded decision (it does not by default).

## Test plan (EARS criterion -> test)

- C1 -> unit: route returns `text/csv` + correct filename; end-to-end:
  click Export, a CSV downloads.
- C2 -> unit: path-traversal report ids are rejected with 400 before any
  query (security floor).
- C3 -> unit: zero-row report yields a header-only CSV.
- C4 -> unit: a `=SUM(...)` cell is escaped to `'=SUM(...)`.
- C5 -> unit: button moves idle -> busy -> idle; end-to-end: button is
  disabled and `aria-busy` during the export (accessibility floor).

## Analyze notes (read-only check before code)

- Does the plan satisfy every acceptance criterion? Yes (C1..C5 mapped
  above).
- Does it break a rule? No. The security risk (path traversal, formula
  injection) is handled by C2 and C4; both are in the mandatory floor.
- Gaps: none. The report query already exists; this spec only adds the
  encoder, the route, and the button.
