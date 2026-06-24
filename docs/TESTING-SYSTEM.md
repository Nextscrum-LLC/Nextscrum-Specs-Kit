<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# TESTING-SYSTEM.md: How we turn a spec into the tests it needs

> Companion to `docs/SPEC-SYSTEM.md`. That file explains how an idea
> becomes running code. This file explains the one stage that sat thin:
> turning each acceptance criterion into the full set of tests it deserves,
> across every quality dimension, with nothing missed by accident.

---

## 0. Who this is for

A developer (or a future you) who can write a test but wants to stop
*guessing which tests to write*. After this page you can run the clarify
pass on any spec, produce a coverage matrix, and know the gaps are audited
choices, not blind spots.

The shape borrows from public spec-driven toolkits (GitHub Spec Kit added a
`/clarify` step for the same reason) and grounds the content in two
standards so "did we miss anything?" has a real answer:

- **ISO/IEC 25010** (the software product quality model): the eight quality
  characteristics every serious test plan covers. This is the *dimension*
  axis ("what kinds of things can break").
- **ISTQB test-design techniques** (International Software Testing
  Qualifications Board): equivalence partitioning, boundary value analysis,
  decision tables, state-transition testing. This is the *case* axis
  ("which specific inputs and transitions to test").

One axis answers "which dimensions", the other answers "which cases". The
clarify pass walks both.

---

## 1. Glossary (every short form spelled out)

| Short form | Full name | Plain meaning |
|---|---|---|
| EARS | Easy Approach to Requirements Syntax | the "WHEN ... THE SYSTEM SHALL ..." acceptance-criterion format |
| ISO 25010 | ISO/IEC 25010 product quality model | the standard list of quality dimensions (performance, security, usability, etc.) |
| ISTQB | International Software Testing Qualifications Board | the body whose test-design techniques we use to enumerate cases |
| BVA | Boundary Value Analysis | test the values right at the edge of a range (min-1, min, min+1, ...) |
| EP | Equivalence Partitioning | one test per class of input that behaves the same way |
| ADA | Americans with Disabilities Act | the law that makes accessibility a requirement, not a nicety |
| a11y | accessibility | shorthand (a + 11 letters + y) |
| WCAG | Web Content Accessibility Guidelines | the testable accessibility standard; we target version 2.2 level AA |
| INP / LCP / CLS | Interaction to Next Paint / Largest Contentful Paint / Cumulative Layout Shift | Google Core Web Vitals; responsiveness and visual-stability metrics |
| OWASP ASVS | Open Worldwide Application Security Project, Application Security Verification Standard | the checklist we lean on for security tests |
| UAT | User Acceptance Testing | the by-hand checks the owner runs to call something done |

---

## 2. Where this sits in the lifecycle

`SPEC-SYSTEM.md` Section 2 has the loop. This stage lives between Analyze
and Build:

```
Plan (3) -> Analyze (4) -> [ Clarify + Generate tests ] -> Build (5) -> Record Facts (6)
```

Analyze is the read-only paper check that the spec, plan, and tasks agree.
The clarify pass is the next read-only step: it reads the same files, finds
the boundaries and dimensions the criteria do not spell out, asks the owner
the ones that are genuinely undecided, and writes the tests. It runs
*before* Build so the answers can still change the plan cheaply (a boundary
answer often reshapes a contract).

---

## 3. The two axes

### Axis A: dimensions (ISO 25010)

Each dimension you might test, the standard it tests against, and where it
typically lives in a suite. The clarify pass asks about a dimension only
when it applies to the spec in hand.

| Dimension | ISO 25010 characteristic | Tests against | Typically lives in |
|---|---|---|---|
| Functional | Functional suitability | the EARS criterion itself | `plan.md` test plan, most unit tests |
| Security | Security | OWASP ASVS, the security rules | input-sanitization + auth tests |
| Accessibility | Usability (accessibility) | WCAG 2.2 AA | the a11y end-to-end spec |
| Performance / speed | Performance efficiency | budget numbers in `quality-budgets.md` | perf-budget tests |
| Responsiveness | Compatibility / usability | breakpoint px, Core Web Vitals | visual / viewport tests |
| UI style / design system | Usability | design tokens + visual baselines | token + visual-baseline checks |
| Reliability under failure | Reliability | failure-isolation rules | integration tests |
| Guardrails (our rules) | Reliability / maintainability | R1..RN | rule-coverage tests |

**The mandatory floor (gate-enforced): Functional, Security, Accessibility.**
Every folder spec must cover these or record an audited skip. The rest are
opt-in per spec, decided during clarify, so a spec with no real performance
budget does not collect empty performance rows.

### Axis B: cases (ISTQB techniques)

Within a dimension, cases are enumerated by technique, not by inspiration.
This is what makes coverage complete instead of "what the author thought
of".

| Technique | When the contract has... | Generates |
|---|---|---|
| Equivalence partitioning | any input field | one test per valid class + one per invalid class |
| Boundary value analysis | a numeric or length range | min-1, min, min+1, max-1, max, max+1 |
| Decision table | combined conditions | one row per condition combination |
| State-transition | a state machine | every legal transition + every illegal one rejected |

Example: a state machine `queued -> running -> done -> archived` yields a
test per legal hop plus a rejection test for each illegal hop (act while
already running, re-fire, fail mid-flight). The author does not decide
*whether* to test those; the technique lists them, and clarify only asks
what the expected behavior is.

---

## 4. The clarify flow, end to end

```
/spec-tests SPEC-NNN
  1. READ       spec.md (EARS) + plan.md (contracts, state machine) + quality-budgets.md
  2. DERIVE     a happy-path test per criterion                 (silent)
  3. ENUMERATE  boundary + state + decision cases per technique (silent)
  4. CLARIFY    walk the applicable ISO-25010 dimensions; ask ONLY the open
                questions, each with a recommended default pre-selected
  5. GENERATE   unit (wide base) + end-to-end (thin top), each tagged
  6. RECORD     write tests.md: the criterion-by-dimension matrix + the test list
  7. RUN        npm test + the end-to-end suite (the auto-run E2E practice); report green / red
```

Steps 2 and 3 need no input; the EARS sentence is the oracle and the
techniques are mechanical. Step 4 is the only place the owner is involved,
and only for decisions the spec left open. That is the "chat way": a short,
focused question set, not a blank page.

---

## 5. Naming and traceability

One identifier threads requirement to test:

```
SPEC-NNN / C<criterion-number> / <dimension> / <case>
```

Examples:

```
SPEC-000/C1/func/happy
SPEC-000/C3/bva/empty-report
SPEC-000/C2/sec/path-traversal
SPEC-000/C1/a11y/download-name
```

Dimension codes: `func`, `sec`, `a11y`, `perf`, `resp`, `style`, `rel`,
`rules`. The criterion number `C#` is **immutable**: once a criterion has a
number it keeps it forever, even if the criterion text is edited, so a test
tag always points at the same requirement. (Same discipline as `SPEC-NNN`
numbers. This is the one idea worth borrowing from Spec Kit's `FR-NNN`
functional-requirement IDs; we do not keep a separate functional-
requirement list because our EARS criteria already are that list.)

How it appears per layer:

```js
// Unit runner: describe is the criterion, it() is dimension + case
describe("SPEC-000/C1", () => {
  it("[func] GET /reports/:id/export returns text/csv", ...)
  it("[bva] export of a zero-row report returns header-only CSV", ...)
});
```
```js
// End-to-end runner
test("SPEC-000/C2/sec: filename param cannot escape the export dir", ...)
```
```yaml
# manifest-driven flow
- id: export-csv
  req: SPEC-000
  case: C1/func/happy
```

`npm test -- -t "SPEC-000"` then runs every test for a spec, and the
coverage gate diffs the IDs present against the matrix in `tests.md`.

---

## 6. The `tests.md` artifact (the 4th spec file)

A folder spec has `spec.md`, `plan.md`, `tasks.md`, and now `tests.md`. It
holds the coverage matrix (criterion rows, dimension columns) and the
tagged test list. A cell is `tier + layer` (for example `func` covered in
the unit runner), or a dash for an audited skip ("clarify decided this
dimension does not apply here"). A dash is a recorded decision, not a silent
gap; that distinction is the whole point.

The live worked example is `docs/specs/000-example-feature/tests.md`. Read
it alongside this page the way you read SPEC-000's `spec.md` to learn the
EARS format.

---

## 7. The facts layer: `quality-budgets.md`

A test that asserts a number needs that number to live in one place. A
breakpoint, an export-latency budget, the WCAG target, a path allowlist, a
length limit: these are testable invariants, and they live in
`docs/quality-budgets.md`. The clarify pass reads it so it generates tests
against the agreed numbers rather than re-deriving them.

Do not confuse this with "Facts to Record" in `SPEC-SYSTEM.md`. That term
means updating the architecture docs when a feature lands (the ripple
step). "Quality budgets" are the stable thresholds the tests check. Two
different things; two different names on purpose.

`quality-budgets.md` holds numbers and invariants (machine-adjacent, read
by tooling). The per-module `DEV-NOTES.md` files hold prose rationale and
stack orientation for a new developer. When a test needs a value, it comes
from `quality-budgets.md`; when a human needs the why, it is in
`DEV-NOTES.md`.

---

## 8. Scope by spec size

Clarify effort tracks the folder-vs-inline threshold in `SPEC-SYSTEM.md`
Section 4. Do not run the full dimension walk on a copy tweak.

| Spec kind | Clarify scope |
|---|---|
| Folder spec (cross-layer, has a plan) | full ISO-25010 dimension walk; write `tests.md` |
| Inline spec (single-file bug or tweak) | one question: "what boundary did you miss?"; one failing test, then the fix |

A bug is a boundary you missed once. The inline path records it as a
permanent case so it cannot regress, without the ceremony of the full
matrix.

---

## 9. When it runs, and how it cannot be skipped

- **Auto-run after Analyze (the coverage rule (R8)).** The main session runs
  the clarify pass for any folder spec before Build, without waiting to be
  asked (the same "main session owns the trigger" pattern as the auto-run
  E2E practice for the end-to-end suite). The owner is only pulled in for the
  clarify questions.
- **Re-run on requirement change.** A changed contract opens new
  boundaries; re-run to elicit just the deltas (`SPEC-SYSTEM.md` Playbook
  C).
- **Advisory-by-default coverage gate.** `scripts/rules/25-test-coverage.mjs`
  runs under `npm run audit:rules`. It surfaces a warning when a folder spec
  lacks `tests.md` or leaves an EARS criterion with no test reference. It is
  advisory by default (surfaced as a warning so an in-progress spec does not
  block a commit); set `SPECKIT_STRICT=1` to make it (and R15) hard blocks when
  your team is ready.
- **Every failure becomes a permanent test (R15).** A `fix:` commit that changes
  source must add a regression test; `scripts/check-regression-test.mjs` checks
  it in the commit-msg hook (warn by default, block under `SPECKIT_STRICT=1`).
  The `/regress` command drives the failing-test-first loop, and the warn-only
  `test-no-shrink` guard flags a commit that deletes tests, so the suite accretes
  rather than erodes. The suite grows; individual tests stay fixed (a test that
  rewrote itself to pass would stop catching regressions).

The tooling cannot run an interactive question set on its own, so the
clarify pass is not silently automated. Instead it is auto-triggered by the
main session and tracked by the coverage gate; an uncovered spec surfaces at
commit time (a warning by default, a block once you flip it on), the same
way every other guardrail here surfaces a forgotten step.

---

## 10. How this compares to Spec Kit

| Concept | Ours | Spec Kit |
|---|---|---|
| ask before coding | the clarify pass (this doc) | `/clarify` |
| functional requirements | EARS criteria with immutable `C#` ids | `FR-NNN` separate list |
| non-functional requirements | the ISO-25010 dimension axis in `tests.md` | partial (in plan technical context) |
| stable test-to-requirement trace | `SPEC-NNN/C#/dim/case` tags | spec-to-task links |
| quality thresholds | `quality-budgets.md` | plan technical context |

We track *more* than base Spec Kit (the dimension axis is full non-
functional coverage) with one fewer list to maintain (criteria are the
functional requirements, not a parallel `FR-NNN` registry that would drift).

---

## 11. Mechanical gates vs. team discipline

A few parts of this stage sit on the discipline side by design; know which:

- The coverage gate is advisory by default; an uncovered criterion surfaces
  a warning rather than blocking a commit, so an in-progress spec keeps
  moving. Read the warnings; flip it to blocking when your team is ready.
- The gate checks that each criterion is *referenced* by a test. Verifying
  that the mandatory-floor dimensions (func / sec / a11y) are each present
  per criterion is the dimension-level rung you turn on next.
- The clarify pass is a practice plus a command, not a gate on its own (a
  gate cannot run an interactive question set). The coverage rule and the
  coverage gate are what keep it from being forgotten.

---

## 12. One-screen cheat sheet

```
AXES:   dimensions = ISO 25010 (func/sec/a11y/perf/resp/style/rel/rules)
        cases      = ISTQB (equivalence partitioning, boundary value, decision, state)
FLOOR:  func + sec + a11y mandatory on folder specs; rest opt-in via clarify
FLOW:   read -> derive -> enumerate -> clarify (ask only open Qs) -> generate -> record -> run
ID:     SPEC-NNN/C#/dimension/case      (C# is immutable)
FILE:   docs/specs/NNN-name/tests.md    (criterion x dimension matrix; dash = audited skip)
FACTS:  docs/quality-budgets.md         (the numbers tests assert against)
RUN:    /spec-tests SPEC-NNN            (auto after Analyze, per the coverage rule (R8))
GATE:   scripts/rules/25-test-coverage.mjs (advisory by default; flip to blocking when ready)
SCOPE:  folder spec = full walk; inline bug = one boundary question
```
