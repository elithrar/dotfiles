---
name: simplify
description: "Audits a codebase for unnecessary complexity -- premature abstractions, deep nesting, inconsistent patterns, and indirection that hurts readability. Use when asked to simplify code, audit complexity, reduce cognitive load, or review maintainability. Triggers: simplify, complexity audit, too complex, hard to read, maintainability review."
---

# Complexity Audit

Identify concrete, fixable complexity issues in a codebase. Focus on changes that reduce the cost of reading, modifying, and debugging code -- not style preferences or nitpicks.

## Workflow

1. Read project documentation (README, AGENTS.md, architecture docs) to understand intended patterns and conventions
2. Identify the largest and most-modified source files as starting points
3. Search for patterns in each category below, working outward from hot paths
4. Produce findings per the output format

## Patterns

### Abstraction

- Premature wrappers, base classes, or indirection layers serving only one caller
- Helper functions under ~5 lines used once -- inline when the logic reads clearly at the call site
- Import chains where duplicating a few lines would be simpler than the dependency
- "Utility" modules that are grab-bags of unrelated functions

### Control Flow

- Nested conditionals (3+ levels) that could use early returns or guard clauses
- Complex conditional chains replaceable with lookup tables or exhaustive matching
- Try/catch blocks that swallow errors or catch too broadly

### Consistency

- Conflicting retry, timeout, or error handling strategies for the same kind of I/O
- Repeated hard-coded strings that belong in a constant
- Multiple patterns for the same operation (e.g., two different HTTP request helpers)
- Mixed abstraction levels in the same function

## Rules

- Read actual source files before making claims. Every finding must cite a specific file path and line range.
- If a pattern has a documented reason (code comment, AGENTS.md, architecture doc), note the justification and assess whether it's still valid -- do not blindly flag it.
- Only report findings where the suggested fix genuinely reduces complexity. "Move to a separate file" is not a simplification.
- Rank by maintenance cost: how much does this pattern increase the effort to read, modify, or debug the surrounding code?
- **Cap at 10 findings.** Fewer is fine if the codebase is clean.

## Output Format

Numbered list, highest impact first. Each finding follows this structure:

> **[N]. [Pattern name] -- `file_path:line_range`**
> Problem: What's wrong and why it matters (1-2 sentences).
> Fix: The concrete change to make (1-2 sentences).

## Examples

### Good findings

**1. Unnecessary wrapper -- `src/utils/fetchHelper.ts:12-28`**
Problem: `fetchWithHeaders()` wraps `fetch()` adding only a Content-Type header, but every caller already sets its own headers -- the wrapper adds indirection without reducing duplication.
Fix: Inline the fetch call at each of the 3 call sites and delete the helper.

**2. Deeply nested handler -- `src/handlers/process.ts:45-78`**
Problem: `handleEvent()` nests 4 levels deep checking event type, auth, feature flags, and payload shape. Each level increases cognitive load and obscures the early-exit behavior.
Fix: Invert to guard clauses that return early, flattening the happy path to one level.

**3. Inconsistent error handling -- `src/api/users.ts:30-55` vs `src/api/orders.ts:22-48`**
Problem: `getUser()` wraps errors in a Result type while `getOrder()` throws and relies on a catch in the route handler. Same I/O pattern, two different strategies -- forces readers to check which convention each function uses.
Fix: Align both to the Result pattern already used in `getUser()`, since the project's AGENTS.md mandates Result types at API boundaries.

### Bad findings (do not produce these)

- "The codebase has too many abstractions" -- no file reference, no actionable fix.
- "Move `parseInput()` to a separate utils file" -- moving code is not simplifying it.
- "This function is 80 lines long" -- length alone is not a complexity problem if the logic is linear and readable.
- Flagging a pattern that AGENTS.md explicitly mandates without acknowledging the justification.
