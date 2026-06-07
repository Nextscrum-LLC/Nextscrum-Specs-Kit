---
description: Pedagogical walk-through of a file or function. Architect-voice with code references, design rationale, and big-co pattern analogues.
argument-hint: [path/to/file.js | path/to/file.js:functionName]
---
<!-- Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. -->


NextScrum is a programmer with a gap since last writing code regularly. When asking for an explanation, the want is:
- One-line "what is this thing for"
- Walk through file structure / function flow
- Big-co pattern analogue where useful ("this is the Strategy pattern", "this is the same as gRPC interceptors")
- What was rejected and why
- What's deferred / known-broken / TODO
- A 1-2 line "what I'd change in v2"

## How to do it

1. **Read the file** (`Read` tool, full file unless > 1000 lines).
2. **If a function name is specified**, locate it; otherwise treat the whole file.
3. **Walk through in this order:**
   - Module-level docstring / top comment (if present, summarize it)
   - Imports - what does it depend on, why each one
   - Constants / config - non-obvious values explained
   - Functions in source order - for each: signature, what it does in one paragraph, any traps
   - Exports - what the rest of the codebase relies on from this file
4. **Cross-reference** - find 1-2 places where this file is imported / called from. Show those.
5. **Note what's missing or wrong** - every file has rough edges; surface the top 1-3.
6. **Big-co analogue** - close with "in big-co terms, this is the X pattern" if applicable.

## Voice

- Concrete code references (file:line format like `client.js:85`)
- Trade-off framing on design choices
- Direct opinion, not neutral menu
- No hand-waving - if something is unclear in the code, say so

## What NOT to do

- Don't dump the entire file content unless the user asks
- Don't explain syntax (NextScrum knows the language); focus on architecture and intent
- Don't pretend something is fine when it's broken; flag it

## Output shape

```markdown
## What `<file>` does

<one-paragraph summary>

## Walk-through

### Imports
...

### Constants / config
...

### `functionName(args)`
**What it does:** ...
**Watch out for:** ...
**Where it's called from:** path/to/caller.js:line

(repeat per function)

### Exports
...

## Cross-references
- `path/to/caller.js:line` - uses this for X

## Rough edges
- (top 1-3 things that could bite us)

## Big-co analogue
This is the <pattern> pattern, same as <known system>.
```
