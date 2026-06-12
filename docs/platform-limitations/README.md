<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

> **Backs rule R10** (platform-limitation registry). See the [rules index](../rules/README.md).

# Platform-limitation registry (PL-NNN)

A catalog of **confirmed hard limitations in third-party platforms** (browser
APIs, runtimes, external services, libraries) that you hit, grounded in primary
sources, and how you worked around them. Companion to **R9** (always check current
docs plus prior art before asserting third-party behavior). R9 is the discipline;
this registry is the memory.

## Why this exists

Some bugs are not *your* bugs. They are limitations of a platform you depend on.
When you hit one, you typically burn a whole session: reproduce it, read the
official docs, search the issue trackers, find that other developers hit the same
wall, and pick a workaround.

Without a record, the **next** session redoes all of that from zero. With a
record, it starts from "here is the confirmed limitation, here are the sources,
here is what we chose, **and here is the re-check list in case the platform has
since fixed it.**" That last clause matters: a platform limitation is a
*point-in-time* fact. Platforms ship fixes. A PL record is a strong prior, **not**
an eternal truth, so every record carries a re-verify step.

## What qualifies as a PL record

Create a PL record only when ALL of these hold:

1. The root cause is in a **third-party platform**, not your code (your code may
   need to *work around* it, but the defect or limitation is upstream).
2. It is **confirmed against primary sources** (official docs plus at least one
   issue tracker or vendor acknowledgement), per R9, not a hunch.
3. It **cost real time** or constrains a design choice, so future sessions benefit
   from not re-deriving it.

A normal bug in your own code does **not** get a PL record (it gets a fix plus a
test plus maybe a post-mortem). A PL record is specifically for "the platform will
not let us do X the way we wanted."

## The registry (index)

| ID | Title | Platform / API | Status | Last verified |
|---|---|---|---|---|
| *(none yet)* | - | - | - | - |

**Status values:** `open` (hit it, deciding the workaround) / `mitigated`
(workaround shipped, limitation still exists upstream) / `resolved` (workaround
shipped and stable) / `fixed-upstream` (platform fixed it; the workaround can be
simplified or removed, record kept for history).

## How to add a record

1. **Ground it first (R9).** Fetch the current official docs for the exact API or
   option, and search the relevant issue trackers and vendor Q&A.
2. **Claim the next `PL-NNN`** id (zero-padded and monotonic: the first record
   takes the lowest unused number).
3. **Copy the template below** into `PL-NNN-<short-kebab-title>.md` and fill it.
4. **Add one row** to the index table above.
5. **Establish the relationships:** link the PL from the relevant ADR / spec /
   rule, and link those back from the PL's "Related" section. The PL is the hub;
   the details live in the PL doc, the decision lives in the ADR, the rule lives
   in `CLAUDE.md`. One source of truth per concept; the PL stitches them.

## The re-verify discipline (the load-bearing part)

Before you rely on a PL record to make a decision:

- Re-open its **Sources** and check whether the platform shipped a fix since
  `Last verified` (read the linked issues for a "fixed in vN" comment; check the
  docs' "since version" notes).
- If the limitation still stands, bump `Last verified` to today.
- If it was **fixed upstream**, set status `fixed-upstream`, note the version, and
  open follow-up work to simplify or remove the now-unnecessary workaround.

This is R9 applied to your own records: even *your* grounded findings go stale.

## Detail-doc template

```markdown
<!-- Copyright (c) 2026 <OWNER>. <LICENSE>. -->

# PL-NNN - <one-line title>

- **Status:** open | mitigated | resolved | fixed-upstream
- **Platform / API:** <e.g. the exact runtime API and option>
- **Observed on:** <platform/library version(s) where reproduced>
- **Last verified:** <YYYY-MM-DD> against <what was checked>
- **Severity for us:** <why it matters to the product>

## Symptom
<What a user or developer actually observes.>

## Root cause (grounded)
<The real mechanism, in plain terms. Separate confirmed-from-docs vs inferred.>

## Sources
<Primary sources only: official docs lines plus issue-tracker links plus vendor
Q&A. This is the R9 evidence. Each claim above should trace to one of these.>

## Why it is a platform limitation (not our bug)
<One paragraph: the platform does not support what we wanted, with the doc or
issue that proves the gap.>

## Candidate workarounds considered
<Table: approach | fixes it? | trade-off | verdict. Keep the rejected ones; the
"why not" is as valuable as the choice.>

## Chosen workaround
<What we shipped (or will ship) plus a link to the ADR / commit / spec. If still
open, say "pending" and what gates the decision.>

## Re-verify checklist (R9)
<Concrete list of links or queries to re-check whether the platform has fixed
this, before relying on this record again.>

## Related
<Links to ADRs, specs (SPEC-NNN), rules (R-NN), other PLs. Bidirectional: also add
a back-link from each of those to this PL.>

## Doc-debt this created (if any)
<Any docs that asserted something this limitation disproves, which must be
corrected so the repo stays honest.>
```

## Relationship to the methodology

- **R9** (engineering.md "External-system grounding"): the discipline that
  produces a PL record. You cannot file a PL without R9 grounding.
- **R10** (this registry): the rule that says *file the PL* once grounded.
- **ADRs**: the PL records the *limitation*; the ADR records the *decision* about
  how to live with it. They link to each other.
- **`scripts/rules/27-platform-limitation-refs.mjs`**: the warn-check that flags a
  `PL-NNN` reference with no matching file, or a detail doc missing from the index
  above.
