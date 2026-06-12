<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# Architecture Decision Records (ADRs)

An ADR captures one architectural decision: the context that forced it, the
choice made, and the consequences accepted. It exists so that six months later
nobody re-litigates a settled question, and so a new engineer can read why the
system is shaped the way it is.

## Conventions

- One file per decision, numbered sequentially: `0001-short-title.md`,
  `0002-...`, and so on. Numbers never get reused.
- Use `0001-record-template.md` as the starting point.
- Status moves through: `proposed` → `accepted` → (optionally) `superseded by
  0007`. Never delete an ADR; supersede it.
- When a decision is locked, add a one-line row for it in the project
  `CLAUDE.md` "Architectural decisions" section pointing back to the ADR.
- When an ADR elaborates a rule, or records something a rule protects from
  regressing, add a one-line doc -> rule reverse-lookup banner at the top
  linking back to the rule (see the convention in
  [docs/rules/README.md](../rules/README.md)). `0002-example-decision.md` shows
  the shape.

## Why bother

The ledger (`docs/requirements.md`) tracks what we are building. ADRs track why
we chose the shape we chose. They are different questions and they age
differently: requirements churn weekly, decisions should age slowly. Keeping
them apart keeps both honest.
