# Performance and ownership

## Measure the affected workload

Reproduce the relevant interaction after warmup and compare the same workload before and after. Record client build, enabled add-ons, profiler state, CPU metric, allocation activity, and retained-object counts. Distinguish temporary garbage, a reusable pool's high-water mark, and continuing growth across repeated cycles.

Use the target client's profiler documentation through [clients and sources](clients-and-sources.md). Check availability, units, averaging window, and whether profiling is enabled. Ticks are not necessarily seconds; recent, encounter, session, and peak measurements answer different questions. An isolated function measurement does not establish whole-encounter performance.

## Own runtime state

Give timers, events, callbacks, frames, and retained closures an owner and an end condition. Stop obsolete work on disable or reassignment. Preserve cleanup belonging to a longer lifecycle. Delayed callbacks must verify that their target and operation are still current, including after code that can synchronously reenter or replace them.

WoW frames are not destroyed by hiding, unparenting, or dropping Lua references. Reuse or pool frames instead of reconstructing them on refresh, resize, or profile changes. Reconcile the old object set against the new configuration, and reset reused objects' callbacks, data references, visibility, anchors, and cached state while preserving constructor-owned behavior.

## Schedule and cache deliberately

Use events for state changes, owned tickers for periodic work, and `OnUpdate` only while frame-cadence work is needed. Avoid one idle updater per row. Use elapsed time, bound catch-up after stalls, coalesce event bursts, and update only affected objects. Stop hidden/inactive work when its contract permits.

Give memoized results explicit validity keys and a size or eviction policy. Include dependencies such as unit identity, profile revision, effective scale, and metadata readiness. Use weak references only when losing an entry is harmless and recomputation is valid. Treat unavailable asynchronous metadata as pending; deduplicate requests and invalidate negative cache entries when data arrives.

Avoid table, closure, and string churn in hot paths where measurement shows it matters. Keep reused scratch storage's ownership clear. Prefer eliminating unnecessary work to speculative local-variable tuning or forced garbage collection.

Repeat relevant open/close, enable/disable, profile, and reuse cycles. Check created objects and active callbacks as well as memory; stable Lua memory alone does not prove engine allocations or recurring work are bounded.
