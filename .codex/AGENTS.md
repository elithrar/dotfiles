# Software engineering

These are global defaults. Apply repository-specific guidance and conventions to
the work at hand; use judgment where these defaults do not fit.

## Scope and technical judgment

- Ground decisions in actual code, requirements, and observed behavior. Inspect
  enough implementation, callers, and tests to understand the change. Verify
  unfamiliar or changing APIs against authoritative docs or dependency source.
- Challenge flawed assumptions with evidence and explain the decisive tradeoff.
  Ask when uncertainty would materially change the design or scope; make routine
  implementation decisions independently.
- Treat questions, reviews, and plans as read-only unless implementation is
  requested. Complete implementation, relevant integration, validation, and fixes
  within the requested scope. Report findings with concrete evidence and impact;
  state blockers and verification gaps rather than implying completion.

## Structure and maintainability

- Solve the underlying problem at the layer that owns it. Reuse existing shared
  components and conventions before adding parallel implementations. Keep the
  change coherent and focused; include refactoring when it makes the solution
  sound, without turning a local fix into an unrelated redesign.
- Prefer straightforward control flow, descriptive names, and cohesive modules
  with explicit dependencies. Keep invariants and related behavior together;
  separate domain logic from I/O when it improves reasoning and testing.
- Introduce abstractions for a concrete responsibility or repeated concept, not
  hypothetical future uses. A little duplication can be clearer than indirection
  that hides meaningful differences. Remove obsolete code rather than preserving
  speculative extension points.
- Use the established toolchain, formatters, linters, and generators. Change the
  source of generated artifacts and review the resulting diff. Keep dependencies
  and lockfile changes deliberate and limited to the task; weigh a dependency's
  maintenance and operational costs against what it replaces.

## Types, APIs, and errors

- Model domain concepts and valid states explicitly. Use the language's type
  system to make invalid combinations difficult to express, while keeping types
  understandable. Prefer narrowing over unchecked assertions or casts. Handle
  closed variants exhaustively; handle unknown external values deliberately when
  formats are extensible. Fix diagnostics where practical and justify necessary
  suppressions.
- Validate external data at trust boundaries; a static type is not runtime
  validation. Keep unavoidable unsafe operations or type-system escapes local,
  and document the invariant that makes them sound.
- Design APIs from the caller's perspective: clear names, consistent semantics,
  small public surfaces, explicit ownership and side effects. Prefer named
  options or domain types when positional flags obscure intent. Account for
  compatibility in public APIs, wire formats, persisted data, and configuration.
- Represent expected failure explicitly using the codebase's idioms. Preserve
  useful error context and distinguish absence, invalid input, and operational
  failure. Avoid silently swallowed errors, success-shaped fallbacks, and panics
  for recoverable conditions; handle or propagate errors where responsibility is
  clear.

## Tests and validation

- Match validation to the behavior changed and the risk involved. Use focused
  tests and checks while iterating; broaden coverage for shared contracts,
  platform differences, or integration risk. Once the relevant checks pass,
  repeat them only when new changes or evidence justify it.
- Test observable contracts and meaningful regressions, including failure paths
  and boundary cases. Check existing coverage first. Choose the test layer that
  can expose the bug; repeat scenarios across layers only when they protect
  distinct contracts. Include type-level checks when inference or compile-time
  rejection is part of the API contract. Avoid assertions on details that may
  change safely.
- Keep fixtures and assertions readable, deterministic, and isolated. Reuse
  established helpers without hiding the inputs that explain a scenario. Review
  changed snapshots and generated expectations against intended behavior.
- Exercise UI changes in the running interface and inspect them visually when
  possible, including relevant interaction and layout states. Report unavailable
  environments honestly. Distinguish source changes, passing tests, deployment,
  and behavior actually observed at runtime.

## Comments and documentation

- Let code express the mechanics. Use comments to explain intent, invariants,
  constraints, and surprising tradeoffs; document public contracts and non-obvious
  failure behavior. Keep useful existing explanations accurate as behavior changes.
- Write for maintainers who have no conversation history. Describe the current
  behavior and rationale, using concrete names and examples where helpful. Keep
  documentation aligned with the implementation; omit iteration history and
  unnecessary UI copy or explanatory boilerplate.

## Observability and performance

- Make important failures and state transitions diagnosable through the existing
  logging, metrics, and tracing conventions. Include actionable context without
  secrets or unnecessary personal data. Bound metric cardinality and telemetry
  volume; avoid duplicate instrumentation and noisy logs that obscure failures.
- Consider algorithmic cost, allocations, I/O, concurrency, and resource lifetime
  as part of design. Keep work, queues, retries, and retained state bounded where
  inputs or load can grow. Prefer a simpler algorithm or fewer operations before
  adding caching or concurrency with new invalidation or coordination costs.
- For performance work, establish a representative baseline and measure the
  affected path under comparable conditions. Use profiles and benchmarks to
  locate bottlenecks and assess improvements, including memory and tail behavior
  when relevant. Report methodology, variability, and tradeoffs; distinguish
  measured gains from plausible optimizations and avoid unrelated micro-tuning.
