<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# SPEC-000: Tests (coverage matrix + generated cases)

> The 4th spec file (see `docs/TESTING-SYSTEM.md`). Produced by the clarify
> pass as the worked example. Maps every EARS criterion in `spec.md` to its
> tests across the quality dimensions.
>
> Status legend: `ready` = code exists, test can be green now; `pending`
> = the test is the executable spec for a task that has not landed, and goes
> green when that task lands; `dash (-)` = audited skip (clarify decided the
> dimension does not apply to this criterion).

---

## Clarify decisions (2026-06-07)

| # | decision |
|---|---|
| C1 filename | `report-<reportId>-<YYYY-MM-DD>.csv`; server date, validated id. |
| C2 traversal | Reject `..`, leading `/`, and drive prefixes via the `^[a-z0-9-]{1,64}$` allowlist, BEFORE any query (QB-SEC-001/002). |
| C3 empty | Zero rows returns the header row only, not a 204 and not an error. |
| C4 formula | Escape a leading `= + - @` by prefixing a single quote, then apply standard CSV quoting (QB-SEC-003). |
| C5 busy | Button disabled + `aria-busy=true` while exporting; back to idle when the download starts (QB-A11Y-002/003). |

## Contract fixes the clarify surfaced (feed back into tasks.md)

1. **Validate first:** the `reportId` allowlist check must run before the
   report query, so a traversal attempt never reaches the data layer.
2. **Encoder before route:** the formula guard lives in `src/lib/csv.js`
   (T1) so it is unit-testable without the route.

---

## Coverage matrix

Mandatory floor = func + sec + a11y. `U` = unit, `E` = end-to-end,
`-` = audited skip.

| Criterion | func | sec | a11y | perf | resp | rel |
|---|---|---|---|---|---|---|
| C1 click Export -> CSV download + filename | U/E | - | U | U | - | - |
| C2 reject path-traversal report id | U | U | - | - | - | - |
| C3 zero-row report -> header-only CSV | U | - | - | - | - | U |
| C4 escape formula-injection cells | U | U | - | - | - | - |
| C5 button busy state while exporting | U | - | U/E | - | - | - |

---

## Generated test list (14 cases)

### C1: Export downloads a CSV
- `SPEC-000/C1/func/content-type` (U) route returns `Content-Type: text/csv; charset=utf-8`. status: pending
- `SPEC-000/C1/func/filename` (U) `Content-Disposition` filename is `report-<id>-<YYYY-MM-DD>.csv`. status: pending
- `SPEC-000/C1/func/download` (E) clicking Export downloads a `.csv` file. status: pending
- `SPEC-000/C1/perf/stream` (U) rows stream; the whole CSV is not buffered before the first byte (QB-PERF-001). status: pending
- `SPEC-000/C1/a11y/button-name` (U) the Export control is a button with the accessible name "Export report as CSV" (QB-A11Y-002). status: pending

### C2: Reject path traversal (security floor)
- `SPEC-000/C2/func/valid-id` (U) a well-formed id passes the allowlist and reaches the query. status: pending
- `SPEC-000/C2/sec/dotdot` (U) `..%2f..%2fetc` style ids return 400 before any query (QB-SEC-001). status: pending
- `SPEC-000/C2/sec/allowlist` (U) ids outside `^[a-z0-9-]{1,64}$` are rejected (QB-SEC-002). status: pending

### C3: Zero-row report
- `SPEC-000/C3/func/header-only` (U) a report with no rows yields a CSV with the header row and no data rows. status: pending
- `SPEC-000/C3/rel/no-partial-file` (U) the empty export is a clean header-only body, never an error or a truncated file (QB-REL-001). status: pending

### C4: Formula-injection escaping (security floor)
- `SPEC-000/C4/func/normal-cell` (U) an ordinary value round-trips unchanged through the encoder. status: pending
- `SPEC-000/C4/sec/formula-escape` (U) a cell `=SUM(A1:A2)` becomes `'=SUM(A1:A2)`; `+`, `-`, `@` leads are escaped too (QB-SEC-003). status: pending

### C5: Button busy state (accessibility floor)
- `SPEC-000/C5/func/state-machine` (U) the button goes idle -> busy -> idle across an export. status: pending
- `SPEC-000/C5/a11y/aria-busy` (E) during the export the button is disabled and `aria-busy=true`, then returns to idle (QB-A11Y-003). status: pending

---

## Audited skips (the dashes, recorded)

- **Security** is tested on C2 (path traversal) and C4 (formula injection),
  the two criteria with a real attacker surface. C1/C3/C5 are read/render
  paths whose SQL safety is covered by QB-SEC-004 at the service layer, not
  per-criterion.
- **Accessibility** is tested on C1 (button has an accessible name) and C5
  (busy state is announced), the UI-bearing criteria. C2/C3/C4 are
  backend-only (no a11y surface).
- **Performance** is tested only on C1 (the one criterion with a streaming
  budget). The others are O(1) validation or pure encoding.
- **Responsiveness / style** are not exercised: this feature adds one button
  to an existing view and no new layout. Recorded as a skip, not forgotten.

## Run

```
npm test -- -t "SPEC-000"               # all unit tests for this spec
npm run test:e2e -- --grep "SPEC-000"   # all end-to-end tests for this spec
```

Every case is `pending` until its task builds (T1..T4 in `tasks.md`); each
is written as the executable spec when that task lands.

---

## Criterion coverage check (every EARS criterion is traced)

| Criterion | Dimensions covered | Floor satisfied? |
|---|---|---|
| C1 | func, perf, a11y | func + a11y present; sec audited-skip |
| C2 | func, sec | func + sec present; a11y n/a (backend) |
| C3 | func, rel | func present; sec/a11y audited-skip |
| C4 | func, sec | func + sec present; a11y n/a (backend) |
| C5 | func, a11y | func + a11y present; sec audited-skip |

All five EARS criteria (C1..C5) are referenced by at least one tagged test,
and the mandatory floor (functional + security + accessibility) is covered
across the spec: functional on every criterion, security on C2 and C4,
accessibility on C1 and C5. Dashes elsewhere are recorded decisions, not
gaps.
