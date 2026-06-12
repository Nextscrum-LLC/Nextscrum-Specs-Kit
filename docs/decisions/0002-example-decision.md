<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# 0002 - CSV export defuses spreadsheet formula injection

> **Relates to R8** (acceptance criteria are tested): the security invariant
> recorded below is locked by criterion C4's test
> (`SPEC-000/C4/sec/formula-escape` in
> [the worked example's tests.md](../specs/000-example-feature/tests.md)), so it
> cannot regress. See the [rules index](../rules/README.md). This banner itself
> is the doc -> rule reverse-lookup convention the rules index documents.
>
> Teaching artifact shipped with the kit, paired with the
> `000-example-feature` worked example. It shows what an ADR recorded from a
> feature's "Facts to Record" step looks like. Delete it with the rest of the
> example once read.

- **Status:** accepted
- **Date:** <YYYY-MM-DD>
- **Deciders:** NextScrum

## Context

The CSV export feature serialises arbitrary report cell values. A cell whose
text begins with `=`, `+`, `-`, or `@` is interpreted by Excel, Google Sheets,
and LibreOffice as a formula when the file is opened. A malicious or accidental
value like `=SUM(...)` or a command-bearing payload can execute in the
recipient's spreadsheet. This is CSV injection (also called formula injection).

## Options considered

| Option | Pros | Cons |
|---|---|---|
| Do nothing | simplest | ships a known injection vector to clients |
| Strip leading symbols | safe | silently corrupts legitimate data (negative numbers) |
| Prefix risky cells with a single quote | safe, reversible, preserves the value | a leading quote is visible in some viewers |

## Decision

We prefix any cell beginning with `=`, `+`, `-`, or `@` with a single quote at
serialisation time. The value is preserved and the spreadsheet treats it as
text rather than a formula.

## Consequences

- Export is safe to open in any spreadsheet program by default.
- A few legitimate cells (negative numbers entered as text) gain a leading
  quote when viewed raw. Acceptable trade for closing the injection vector.
- The rule is a security invariant: it is covered by a security-dimension test
  in `docs/specs/000-example-feature/tests.md` and must not regress.

## References

- `docs/specs/000-example-feature/spec.md` (criterion C4)
- `docs/architecture/example-feature-design.md`
