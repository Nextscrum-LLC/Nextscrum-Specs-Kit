<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# Getting started

A literal, first-30-minutes walkthrough: from a fresh copy of the kit to your
first feature shipped on the rails. Every command shows the expected output and
what to do when it does not match.

Commands are shown for Windows PowerShell (NextScrum's environment). The bash
equivalents are identical except where noted.

## 0. Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | 18 or newer | `node --version` |
| npm | ships with Node | `npm --version` |
| git | any recent | `git --version` |
| Claude Code | latest | open it in the project folder |

If `node --version` prints anything below `v18`, install a newer Node before
continuing; the rule scripts use modern JavaScript.

## 1. Get the kit into your project

You have two situations.

**A. Brand-new project.** Copy the kit's contents into your new repo root:

```powershell
# from inside your empty project folder
Copy-Item -Recurse -Force "C:\path\to\nextscrum-specs-kit\*" .
git init
```

**B. Existing project.** Copy only the operating-system folders, so you do not
clobber your source:

```powershell
Copy-Item -Recurse -Force "C:\path\to\nextscrum-specs-kit\.claude"   .
Copy-Item -Recurse -Force "C:\path\to\nextscrum-specs-kit\.husky"    .
Copy-Item -Recurse -Force "C:\path\to\nextscrum-specs-kit\scripts"   .
Copy-Item -Recurse -Force "C:\path\to\nextscrum-specs-kit\docs"      .
Copy-Item "C:\path\to\nextscrum-specs-kit\CLAUDE.md","C:\path\to\nextscrum-specs-kit\RESKIN.md" .
# then merge package.json scripts + devDependencies by hand
```

> Order matters: `git init` must run before step 2, because husky installs its
> hooks into `.git/`. No git repo means no hooks.

## 2. Install and wire the hooks

```powershell
npm install
npm run prepare
```

Expected: `npm run prepare` runs `husky` and exits quietly (no error). Confirm
the hooks are active:

```powershell
git config core.hooksPath
```

Expected output: `.husky`

If it prints nothing, re-run `npm run prepare` and make sure you ran `git init`
first.

## 3. Run the audit (the rails, before you change anything)

```powershell
npm run audit:rules
```

Expected output (the kit ships clean):

```
ok  R1 no-em-dash: no em dashes in user-facing files
ok  R2 no-banned-words: no banned words in user-facing files
ok  R6 done-gate: ledger done-gate clean (0 done entries verified)
ok  R7 spec-refs: all SPEC-NNN references resolve (1 entries)
ok  R7 spec-refs: no depends-on cycles
ok  R7 spec-refs: all Facts-to-Record targets exist
ok  R8 test-coverage: every spec folder's criteria are referenced in tests.md
ok  spec-change-ripple: no staged changes, nothing to check
ok  record-facts-ripple: no staged changes, nothing to check
ok  banned-patterns: no patterns configured, nothing to check
ok  surface-ripple: no surfaces configured, nothing to check
audit:rules - all checks passed.
```

You may also see one warn-only line for `doc-orphans` (a doc with no inbound
link). Warnings do not block; failures (`x` lines) do. If you see any `x`, fix
it before moving on; that is the rails doing their job.

## 4. Re-skin to your stack (once per project)

Open the project in Claude Code and paste the entire contents of `RESKIN.md` as
your first message, after filling in the `THIS PROJECT IS:` paragraph at the top.

The session will: map the kit, grep every `RESKIN` placeholder, set the database
in `db-reviewer`, point `playwright-runner` at your test command, set the
review-marker file globs, fill in `CLAUDE.md`, and re-run the audit. Confirm
each step as it goes.

When it finishes, `npm run audit:rules` should still be green and every
`<PLACEHOLDER>` should be resolved or explicitly deferred.

## 5. Read the worked example (10 minutes, do not skip)

Before writing your own spec, read the example end to end. It is small and shows
the whole loop:

```
docs/specs/000-example-feature/spec.md     ← 5 EARS criteria (C1..C5)
docs/specs/000-example-feature/plan.md     ← the how + Facts to Record
docs/specs/000-example-feature/tasks.md    ← each task names the criterion it satisfies
docs/specs/000-example-feature/tests.md    ← every criterion traced by SPEC-000/C#/dim/case
```

Notice the chain: each criterion in `spec.md` shows up in `tasks.md` (which task
delivers it) and in `tests.md` (which test proves it). That trace is what the
coverage gate enforces. Delete this folder once your team has read it.

## 6. Your first real feature

```
1. In Claude Code:  /feature export-customers
      → creates a branch + a ledger entry in docs/requirements.md with
        acceptance criteria.

2. Write docs/specs/NNN-export-customers/spec.md
      → 3 to 7 EARS criteria. Copy the shape from the example.

3. In Claude Code:  /spec-tests
      → the clarify pass asks you only the open boundary questions, then writes
        tagged tests and the tests.md coverage matrix.

4. Build the feature.

5. npm run audit:rules
      → green means voice, spec refs, and coverage are satisfied.

6. git add -A && git commit -m "feat(export): customer CSV export"
      → husky runs the audit + your tests, and commit-msg enforces the
        Conventional format and any required review markers. A bad commit is
        refused here, not in review.

7. Move the ledger entry toward done.
      → it cannot reach `done` until Verified by reaches NextScrum-manual (the done-gate).
```

## 7. The same loop on a real SaaS (a concrete picture)

The command list above is the shape. Here is what it looks like with a real
product behind it, so the steps are not abstract. Say you are building
**Deskline**, a small support help desk: companies sign up, their customers file
tickets, their agents reply. (The full two-feature version of this walk is in
`README.md` under "A worked example"; this is the short form.)

**First, the one rule the product cannot live without.** Deskline is
multi-tenant: many companies share one database and must never see each other's
tickets. That is a law, not a feature, so you lock it before any code. Run
`/rule` and describe it ("every database read or write is scoped to the current
tenant"). It becomes R9, gets a row in `CLAUDE.md`, and gets a check under
`scripts/rules/` that flags any query missing a `tenant_id` filter. From now on,
an unscoped query fails `npm run audit:rules` before it can land.

**Then the first feature, "a customer files a ticket."** Run `/feature
file-a-ticket`, write the spec with EARS criteria (WHEN a signed-in customer
submits a subject and a message THE SYSTEM SHALL save the ticket against their
tenant and return its id), and `/tasks` splits it across three systems, each with
its own gate:

| Task | System it touches | Review marker | Agent that checks it |
|---|---|---|---|
| T1 | Database (the `tickets` table + `tenant_id` index) | `[db-reviewer-ok]` | db-reviewer |
| T2 | Backend (`POST /tickets`, scoped to the tenant) | `[chain-tracer-ok]` | chain-tracer |
| T3 | UI (the form, wired to the route, with a busy state) | `[chain-tracer-ok]` | chain-tracer |

Now run the same seven steps from section 6 against each task. When you commit
the migration, the commit-msg hook sees a database file and refuses the commit
until the message carries `[db-reviewer-ok]`; the route commit needs
`[chain-tracer-ok]` the same way; and the R9 check runs every time, so the moment
T2 forgets the tenant filter the gate stops it. One ask became a spec, the spec
became tasks that each land on a different system, and a cross-cutting concern
became a numbered rule with a script behind it. That is the whole kit in motion.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `audit:rules` fails with `R1 no-em-dash: em dash` | An em dash slipped into a doc or UI string | Replace it with parens, a semicolon, or two sentences |
| `audit:rules` fails with `R2 no-banned-words: banned word` | A word on the banned list is in client-facing copy | Reword; the list is in `scripts/rules/06b-banned-words.mjs` |
| `R5 review-markers: could not compute required markers` + `fatal: not a git repository` | No `.git` yet | Run `git init`; the check needs staged files to inspect |
| Commit goes through without running hooks | Hooks not installed | `git config core.hooksPath` should print `.husky`; if not, `npm run prepare` |
| `commit-msg` rejects my commit for a missing marker | The commit touches a file pattern in the review-marker trigger map | Run the named agent, address its findings, add the marker to the commit body |
| `spec-refs: Facts-to-Record target does not exist` | A `plan.md` points to a doc you have not created | Create the doc, or fix the path in `plan.md` |
| `test-coverage` warns a criterion is unreferenced | A spec criterion has no test in `tests.md` | Add a test row tagged `SPEC-NNN/C#/dimension/case` |

## What good looks like

- `npm run audit:rules` exits 0.
- `git config core.hooksPath` prints `.husky`.
- Every feature has a `docs/specs/NNN-*/` folder and a ledger entry.
- No requirement is marked `done` that a human has not verified.

When all four hold, the discipline is mechanical and you can stop thinking about
it. That is the entire point of the kit.

## Where to go next

- `README.md` - the daily loop, the re-skin map, the full Deskline worked example, and the three project scenarios.
- `docs/SPEC-SYSTEM.md` - the full lifecycle and why it is shaped this way.
- `docs/TESTING-SYSTEM.md` - how a spec becomes its tests.
- `RESKIN.md` - the adaptation checklist, any time you fork the kit again.
