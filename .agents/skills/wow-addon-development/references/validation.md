# Debugging and validation

## Follow the changed behavior

Prioritize startup failures, data loss, unbounded work, restricted-API misuse, and inaccessible controls. Choose checks that can distinguish the expected behavior from the reported failure; a nearby successful interaction may not exercise the same path.

## Diagnose before changing code

Capture the first Lua error and full stack, client/add-on versions, and the action that triggers it. Use the client's error reporting or the project's error capture tool; later errors may be consequences of the first failure. Reproduce with only required dependencies when interference is plausible, preserving the user's saved data.

Trace the failing handler backward through file load order, initialization, event payloads, and current configuration. Distinguish an ordinary Lua/data error from a secret-value violation or protected-action/taint failure. For restricted failures, inspect the API annotation and calling context rather than hiding the error with `pcall`. Keep temporary diagnostics out of hot paths and remove them after diagnosis.

When a live report contradicts passing tests, preserve it as unresolved evidence; assertion volume does not establish coverage of that path. When the cause is unclear, state plausible explanations and the observation that would distinguish them. Use targeted probes and change one factor at a time. Confirm the fix against the original symptom, not only the reduced reproduction. If runtime access is missing, separate what the code establishes from what still needs observation.

## Select relevant checks

| Change | Useful checks |
| --- | --- |
| Packaging/startup | Clean dependencies; listed Lua/XML files and assets; first run; existing saved data; extracted release artifact. |
| Launcher/menu | Click and drag-release; lock; hide/recover; reload; menu owner hidden. |
| Settings | Navigation and reopening; refresh after hidden changes; programmatic callbacks; focus/cancel behavior. |
| Layout/visuals | Current reference pixels; actual fonts; balanced padding; native dropdown anchors; layering/hit targets; minimum and capped sizes; long text and scroll navigation; fractional scale; changed resolution; safe-area and off-screen restore. |
| Profiles | Shared/class/spec/instance selection; manual mode; copy/reset/delete; missing identity; latest state after deferral. |
| Migration/import | Old/future schemas; repeat migration; malformed nested data; Unicode/false; maximum round-trip; atomic failure. |
| Animation/performance | Equal elapsed time at varied cadence; jitter/reversal; per-frame work; repeated enable/disable and profile changes; bounded objects, timers, events, and history after warmup. |
| Session state | Idle and delayed callbacks; loading/zoning; reload/reconnect; deliberate/cancelled logout; invalid snapshots; separate elapsed-time and missing-data expectations. |

Reuse existing tests. When useful, run the actual implementation in a compatible Lua runtime with a small fixture that rejects unknown APIs and models relevant events, callbacks, or geometry. Exercise registered handlers; for persistence changes, verify restoration and initialization order and reload saved results. Keep offline checks proportional to the behavior at risk.

Model relevant native template defaults and event sequences from matching client sources, including anchors the add-on overrides; a mock that starts in the desired state hides regressions. Use independent failure inputs and check visible results and reachable controls. A resizable flag, parser pass, or mock returning fixed widths is insufficient evidence for usable layout. Add tests where they protect meaningful behavior.

## Report the boundary

Separate source checks, offline execution, and in-client observations. Label substitute-font renders and native-control outlines as offline fixtures. Rendering, physical input, combat/taint/secret behavior, event timing, and in-game CPU require relevant client checks. If unavailable, finish the useful offline work and state the specific remaining checks. Do not imply that source inspection or mocks establish those outcomes.
