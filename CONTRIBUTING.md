# Contributing

The NextScrum Specs Kit is maintained by NextScrum LLC. Thanks for your interest.

## Issues and feedback: welcome

Bug reports, questions, and ideas are genuinely useful. Open a GitHub issue with
a minimal reproduction and what you expected. For security concerns, please
disclose privately rather than in a public issue.

## Pull requests: not at this time

We are not accepting external pull requests right now. The kit is maintained
directly by NextScrum LLC so that ownership and direction stay clear. This may
change as the project grows; for now, the most useful contribution is a
well-described issue.

## Using and adapting the kit (your own fork)

You are free to fork and adapt the kit under the Apache License, Version 2.0. To
run it locally:

```bash
npm install
npm run prepare        # installs the git hooks
npm run audit:rules    # the rule audit; should print "all checks passed"
npm test               # runs the scripts' own self-tests
npm run docs:serve     # the docs site at http://localhost:4000
```

The kit holds itself to the same rules it gives its adopters. A change is ready
when `npm run audit:rules` and `npm test` both pass, commits follow Conventional
Commits, and docs change in lockstep with behavior.

## House style

- No em dashes anywhere; use parentheses, semicolons, or two short sentences.
- No AI attribution in code, comments, or commit messages.
- One concern per file; comments explain WHY, not WHAT.

Please follow our [Code of Conduct](CODE_OF_CONDUCT.md). Notable changes are
recorded in the [Changelog](CHANGELOG.md).
