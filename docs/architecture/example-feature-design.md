<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# Example feature design - CSV report export

> This is a teaching artifact that ships with the kit. It shows what a "Facts to
> Record" target looks like: a short design doc that captures the durable facts a
> feature established, recorded when the feature lands. Delete it with the rest of
> the `000-example-feature` example once your team has read it.

## What this records

The report-export feature (see `docs/specs/000-example-feature/`) added one
endpoint and one client behaviour. The durable facts worth keeping:

- **Export endpoint.** `GET /reports/:id/export?format=csv` returns
  `text/csv` with a `Content-Disposition` filename of `report-<id>-<date>.csv`.
- **CSV safety contract.** Any cell beginning with `=`, `+`, `-`, or `@` is
  prefixed with a single quote before serialisation, to defuse spreadsheet
  formula injection. This is a security invariant, not a formatting choice.
- **Empty report.** A report with zero rows returns a header-only CSV, never an
  error.

## Why a design doc and not just code

The endpoint shape and the formula-injection rule are decisions a future change
could quietly break. Recording them here means a reviewer can check a change
against the stated contract instead of re-deriving it. The spec proves the
feature was built; this doc preserves why it is shaped the way it is.
