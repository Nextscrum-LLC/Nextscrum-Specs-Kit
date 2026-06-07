<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# quality-budgets.md: The numbers and invariants tests assert against

> The single home for testable thresholds. If a test contains a magic
> number or a hard rule (a breakpoint, a latency budget, an allowlist, a
> length limit), the value belongs here and the test references the budget
> id. Read by the clarify pass (`docs/TESTING-SYSTEM.md`) and by humans.
>
> Not to be confused with "Facts to Record" in `docs/SPEC-SYSTEM.md` (that
> is the ripple step that updates architecture docs on landing). These are
> the stable thresholds the tests check.
>
> Each budget has an id (`QB-<dim>-NNN`). Cite it in the test name or a
> comment so a value change is traceable to every test that depends on it.
> Changing a budget is itself a spec plus an architecture-doc update.
>
> RESKIN: every value below is an EXAMPLE budget tied to the SPEC-000
> worked example (CSV report export). Replace the rows with your product's
> real thresholds; keep the table structure, the id scheme, and the
> "how to change a budget" process.

---

## Performance (QB-PERF)

| id | budget | value | source | tested by |
|---|---|---|---|---|
| QB-PERF-001 | report export starts streaming before the full file is built | first byte without buffering the whole CSV | SPEC-000 clarify | unit `SPEC-000/C1/perf` |
| QB-PERF-002 | export of a 10k-row report completes within the request window | <= 2 seconds (p95) | SPEC-000 clarify | end-to-end `SPEC-000/C1/perf` |

> RESKIN example values. Replace with measured budgets for your workload.

---

## Responsiveness (QB-RESP)

| id | budget | value | source | tested by |
|---|---|---|---|---|
| QB-RESP-001 | report table layout breakpoint | 800px; `>= 800px` two-column, `< 800px` stacked | SPEC-000 plan.md | end-to-end `SPEC-000/Cx/resp` (BVA 799/800/801) |

> RESKIN example value (800px is a common breakpoint placeholder).

---

## Accessibility (QB-A11Y)

| id | budget | value | source | tested by |
|---|---|---|---|---|
| QB-A11Y-001 | conformance target | WCAG 2.2 level AA | project a11y baseline | a11y end-to-end spec |
| QB-A11Y-002 | the Export control is a real button with an accessible name | name reads e.g. "Export report as CSV" | SPEC-000 clarify | unit/e2e `SPEC-000/C1/a11y` |
| QB-A11Y-003 | in-progress state is announced | the busy state is an `aria-live=polite` region | SPEC-000 clarify | `SPEC-000/C5/a11y` |

---

## Security (QB-SEC)

| id | invariant | rule | tested by |
|---|---|---|---|
| QB-SEC-001 | the export filename / path param cannot escape the export directory (no `..`, no absolute paths) | input-validation baseline | `SPEC-000/C2/sec` |
| QB-SEC-002 | the report id param is validated against an allowlist pattern before any lookup | input-validation baseline | `SPEC-000/C2/sec` |
| QB-SEC-003 | CSV cell values are neutralized against formula injection (leading `= + - @` are escaped) | output-encoding baseline | `SPEC-000/C4/sec` |
| QB-SEC-004 | SQL is always parameterized; dynamic identifiers validated against an allowlist | data-access baseline | service + route tests |

> RESKIN: keep the security floor invariants; CSV-injection and
> path-traversal are real, generic web concerns and make good examples.

---

## Reliability (QB-REL)

| id | invariant | rule | tested by |
|---|---|---|---|
| QB-REL-001 | a failed export logs one error row and does not corrupt or leave a partial file in place | failure-isolation baseline | `SPEC-000/C3/rel` |

---

## Voice / style (QB-STYLE)

| id | invariant | value | source | tested by |
|---|---|---|---|---|
| QB-STYLE-001 | no em dashes in user-facing surfaces | zero | the no-em-dash rule (R1) | `scripts/rules/06a-em-dashes.mjs` |
| QB-STYLE-002 | banned-word list absent from user-facing copy | zero hits | the banned-word rule (R2) | `scripts/rules/06b-banned-words.mjs` |
| QB-STYLE-003 | design tokens are the source of UI values (color / spacing / type) | per the design-token manifest | design-system baseline | element token invariants |

---

## Testing facts (QB-TEST)

The stable facts the generator needs so it emits correctly-shaped tests.
Prose rationale lives in the per-module `DEV-NOTES.md`.

| id | fact | value |
|---|---|---|
| QB-TEST-001 | unit/logic runner | `<your unit runner>`; files `tests/unit/*.test.js` |
| QB-TEST-002 | integration runner | `<your integration runner>`; needs `TEST_DATABASE_URL` |
| QB-TEST-003 | end-to-end runner | `<your e2e runner>`; files `e2e/tests/*.spec.js`; `npm run test:e2e` |
| QB-TEST-004 | unique test data | a per-test id factory so the suite can run against a shared DB |
| QB-TEST-005 | the testing pyramid | logic in the unit runner (wide base); end-to-end thin top for cross-layer wiring only |

> RESKIN: fill the `<...>` placeholders with your actual runner names and
> file globs. The clarify pass reads these to emit correctly-shaped tests.

---

## How to change a budget

1. A budget change is a spec (it changes tested behavior). Open a `SPEC-NNN`.
2. Edit the value here; cite the spec in the source column.
3. Update every test that references the budget id (grep the id).
4. Record the change in the relevant architecture doc on landing (the
   ripple step), so the truth doc and the budget agree.
