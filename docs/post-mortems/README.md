<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->

# Post-mortems

When something breaks (a regression ships, a gate is bypassed, a wrong
assumption costs a day), write a post-mortem. Blameless: the target is the
system that let it happen, not the person.

The payoff of a post-mortem is the last section: the rule change. A post-mortem
that ends without a concrete, machine-checkable guard is just a story. The point
is to turn a one-time mistake into a check that can never recur silently, the
same way the kit's enforced rules each trace back to a real failure.

Use `TEMPLATE.md`. Name files `YYYY-MM-DD-short-title.md`.
