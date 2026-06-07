<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# How the NextScrum Specs Kit compares to other spec systems

> The short version lives in `SPEC-SYSTEM.md` Section 8 (a five-column matrix).
> This is the long version: a wider field, a deeper capability matrix, an honest
> account of where other systems are stronger, and the one idea that makes this
> kit different.
>
> Accuracy note: the competitor descriptions reflect understanding as of early
> 2026. These tools move fast; re-verify before relying on a specific
> competitor feature.

## 1. The field (what each system actually is)

Spec-driven and agentic-development tooling clusters into three shapes. Knowing
which shape a tool is explains most of the matrix below.

**Generators (spec produces code).** The spec is the input to a build step.
- **GitHub Spec Kit** (open source). A `specify` command-line installer that
  drops slash commands (`/constitution`, `/spec`, `/plan`, `/tasks`,
  `/implement`) and templates into a repo. Agent-agnostic: works with Claude
  Code, Copilot, Cursor, Gemini CLI. Strength: clean scaffolding and the
  constitution concept. The spec stays the source of truth and code is
  regenerated from it.
- **Tessl.** A spec-centric, AI-native vision where the spec is the durable
  artifact and code is a derived, regenerable output, backed by a registry of
  reusable specs. Early and ambitious. Strength: the cleanest statement of
  "spec is the product."

**IDE-native agentic workflows (spec lives in the editor).**
- **AWS Kiro.** An agentic IDE (a Code OSS fork). Spec-driven by default:
  `requirements.md` in EARS, `design.md`, `tasks.md`, plus agent **hooks**
  (run an agent on save/commit) and **steering files** (persistent project
  guidance). Strength: EARS is first-class and the IDE runs the loop for you.
- **Claude Code (native).** Plan mode, `CLAUDE.md`, subagents, hooks, slash
  commands. Not a spec system on its own; it is the substrate this kit is built
  on. Strength: the agent and the enforcement primitives (hooks) in one tool.

**Process methodologies (spec drives a human + agent ritual).**
- **BMAD-METHOD** (Breakthrough Method of Agile AI-Driven Development, open
  source). Agent personas (Analyst, Product Manager, Architect, Scrum Master,
  Developer, QA) across a planning phase and a development phase, producing
  "context-engineered" story files that carry full build context. Strength:
  rich role-play and planning depth for larger efforts.
- **OpenSpec** (open source). Change-proposal-centric: `specs/` holds the
  current truth, `changes/` holds proposals, merged changes are archived.
  Tool-agnostic and lightweight. Strength: the change-driven model keeps the
  truth and the proposal cleanly separated.
- **Agent OS** (Builder Methods). Layered docs: standards, product, and specs,
  written as instructions an agent follows. Strength: a clear standards layer.

**Adjacent (context tools, not full spec systems):** Cursor rule files
(`.cursor/rules`), Cline / Roo "memory bank" markdown, and Aider's
`CONVENTIONS.md`. These persist context or rules but do not carry a spec → plan
→ tasks → verify lifecycle, so they sit outside the main matrix.

## 2. The capability matrix

`yes` = first-class and supported. `part` = possible but manual or partial.
`no` = not a feature of the system. The NextScrum column is the kit in this repo.

| Capability | NextScrum Kit | Spec Kit | Kiro | OpenSpec | BMAD | Tessl | Claude Code native |
|---|---|---|---|---|---|---|---|
| Always-on rules / constitution | yes | yes (constitution.md) | yes (steering) | no | part (agent prompts) | part | yes (CLAUDE.md) |
| EARS acceptance criteria | yes | part | yes | part | part | part | no |
| Spec artifact (what + why) | yes | yes | yes | yes (changes) | yes (PRD) | yes | no |
| Plan / design with contracts | yes | yes | yes (design.md) | part | yes (architecture) | part | part (plan mode) |
| Task breakdown | yes | yes | yes | yes | yes (stories) | part | part |
| Pre-code analyze / consistency check | yes | yes (/analyze) | part | no | part (QA agent) | no | no |
| Dependency graph + cycle detection | yes | no | no | no | no | part | no |
| Keep-docs-true ripple (Record Facts) | yes | regenerates | part | archive | no | regenerates | no |
| Test generation from criteria | yes (/spec-tests) | part | part | no | part | part | no |
| Quality-dimension test floor (security + a11y mandatory) | yes | no | no | no | no | no | no |
| Test-to-criterion trace ids (SPEC/C#/dim/case) | yes | no | no | no | no | no | no |
| Machine enforcement (commits blocked on violation) | yes | no | no | no | no | no | part (hooks, you write them) |
| Done-gate / human-verification ladder (R6) | yes | no | no | no | no | no | no |
| Review-marker enforcement (R5) | yes | no | no | no | no | no | no |
| Voice / IP / banned-word enforcement (R1-R3) | yes | no | no | no | no | no | no |
| Named dev-workflow agents | yes (seven) | part (any agent) | yes (hooks) | no | yes (personas) | no | yes (subagents) |
| Cross-session continuity (handoff + logs) | yes | part (memory/) | no | no | no | no | part |
| Agent-agnostic / portable across tools | part | yes | no (its own IDE) | yes | part | part | no |
| CLI installer / scaffolding | part (copy + RESKIN) | yes | yes (IDE) | yes | yes | yes | n/a |
| IDE integration | via Claude Code | via host agent | yes (native) | no | via host | part | yes |
| Multi-repo / cross-project portability | yes (fork + reskin) | yes | part | yes | part | part | part |

## 3. Reading the matrix

Two patterns fall out.

**The top and middle rows are a tie or a near-tie.** Rules, specs, plans, tasks,
EARS, analyze: the good public systems all do these, and so do we. We borrowed
these on purpose; there is no advantage in being different here. If anything,
Spec Kit's installer and Kiro's IDE make the authoring of these artifacts
smoother than ours.

**The bottom rows are where the kit stands alone.** Machine enforcement, the
done-gate, review markers, the quality-dimension test floor, trace ids, and
voice/IP enforcement are mostly a column of `no` for everyone else. That is not
because those systems forgot; it is because they made a different bet.

## 4. The one idea: generation versus enforcement

Most spec systems bet on **generation**: if the spec is good enough, the agent
produces good code, and the spec stays the source of truth you regenerate from.
The spec is an input.

This kit bets on **enforcement**: the spec and the rules are a contract, and the
tooling mechanically refuses any change that violates the contract. The spec is
a gate.

That difference is the whole personality of the kit:

- A spec criterion with no test cannot pass the coverage gate (R8).
- A security or accessibility dimension cannot be silently skipped; a skip is a
  dash that an auditor can see, not an absence.
- A requirement cannot be marked done before a human has verified it (the
  done-gate (R6) ladder: tests-only < agent-chain-trace < NextScrum-manual <
  production-smoke).
- A cross-layer change cannot be committed without the matching review-marker
  (R5), which means the matching review agent was actually run.
- Em dashes (R1), banned words (R2), and AI-attribution (R3) cannot reach
  anything the client sees, because the commit is refused.

Generation systems make a good outcome **likely**. Enforcement makes a bad
outcome **impossible to ship quietly**. For a services business where every
delivery carries NextScrum's name and reputation, "impossible to ship quietly"
is the property that matters. This is the same reason the kit was extracted from
a product that learned, repeatedly, that prose protocols ("remember to run the
review") fail under fatigue while mechanical gates do not.

## 5. Where the other systems genuinely beat us (honest)

If a client or a teammate pushes, do not oversell. These are real:

- **Spec Kit has a real installer and is agent-agnostic.** `specify init` is one
  command and works across Claude Code, Copilot, Cursor, and Gemini. Our
  "copy the folder and run RESKIN" is more manual and assumes Claude Code.
- **Kiro is IDE-native.** The loop runs inside the editor with hooks on save.
  We run through the terminal and git hooks, which is less smooth for a
  developer who lives in the editor. (We accept this; git hooks are the layer
  that cannot be bypassed.)
- **BMAD has deeper planning ceremony.** Its analyst and architect personas
  produce richer up-front planning artifacts than our single Plan step. For a
  large greenfield product, that depth is real. We deliberately traded it away
  for a lighter loop; on a big enough effort, borrow BMAD's planning phase.
- **Tessl states the spec-as-product vision more purely.** If the industry moves
  to specs-as-registry, Tessl is closer to that future than we are.

Where we do not back down: none of them enforce. They make discipline available;
we make it mandatory. For our use, that trade is correct.

## 6. What we took, and what we refused

**Took:** the constitution idea (Spec Kit), EARS as first-class (Kiro), the
change-vs-truth separation (OpenSpec), the spec-as-source-of-truth instinct
(Tessl), and named agents (BMAD personas, made narrower and task-specific).

**Refused:**
- **Auto-regeneration of code from spec** (Spec Kit, Tessl). Too aggressive for
  a live product that is verified by hand and where a regenerated file could
  quietly drop a hand-tuned fix. We keep humans writing code and use the spec to
  gate it, not to emit it.
- **BMAD's full multi-agent ceremony.** Twelve role-played agents is process
  weight a small team pays for without return. We kept seven narrow, single-job
  agents and made each one a mechanical trigger, not a meeting.
- **A bespoke IDE** (Kiro). We do not want to own an editor; we want to run
  inside the tools the team already uses and put the enforcement in git, where
  nothing can route around it.

## 7. One-line summary

Every mature spec system helps you write a good spec. This one also refuses to
let a bad delivery ship quietly. That is the line, and it is the line a services
business should care about most.
