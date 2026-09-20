# Debugging and validation

## Follow the changed behavior

Prioritize startup failures, data loss, unbounded work, restricted-API misuse, and inaccessible controls. Choose checks that can distinguish the expected behavior from the reported failure; a nearby successful interaction may not exercise the same path.

## Diagnose before changing code

Capture the first Lua error and full stack, client/add-on versions, and the action that triggers it. Use the client's error reporting or the project's error capture tool; later errors may be consequences of the first failure. Reproduce with only required dependencies when interference is plausible, preserving the user's saved data.

Trace the failing handler backward through file load order, initialization, event payloads, and current configuration. Distinguish an ordinary Lua/data error from a secret-value violation or protected-action/taint failure. For restricted failures, inspect the API annotation and calling context rather than hiding the error with `pcall`. Keep temporary diagnostics out of hot paths and remove them after diagnosis.

When the cause is unclear, state plausible explanations and the observation that would distinguish them. Use targeted probes and change one factor at a time. Confirm the fix against the original symptom, not only the reduced reproduction. If runtime access is missing, separate what the code establishes from what still needs observation.

## Select relevant checks

| Change | Useful checks |
| --- | --- |
| Packaging/startup | Clean dependencies; listed Lua/XML files and assets; first run; existing saved data; extracted release artifact. |
| Launcher/menu | Click and drag-release; lock; hide/recover; reload; menu owner hidden. |
| Settings | Navigation and reopening; refresh after hidden changes; programmatic callbacks; focus/cancel behavior. |
| Layout | Minimum size; long text; editor/scroll navigation; fractional scale; changed resolution; off-screen restore. |
| Profiles | Shared/class/spec/instance selection; manual mode; copy/reset/delete; missing identity; latest state after deferral. |
| Migration/import | Old/future schemas; repeat migration; malformed nested data; Unicode/false; maximum round-trip; atomic failure. |
| Ownership/performance | Repeated enable/disable and profile changes; obsolete callbacks; object reuse; bounded allocations/cache/work under the same workload. |

Reuse existing tests. When useful, run the actual implementation in a compatible Lua runtime with a small fixture that rejects unknown APIs and models relevant events, callbacks, or geometry. Exercise registered handlers; for persistence changes, verify restoration and initialization order and reload saved results. Keep offline checks proportional to the behavior at risk.

Use independent failure inputs and check visible results and reachable controls. A resizable flag, parser pass, or mock returning fixed widths is insufficient evidence for usable layout. Add tests where they protect meaningful behavior.

## Report the boundary

Separate source checks, offline execution, and in-client observations. Rendering, physical input, combat/taint/secret behavior, event timing, and in-game CPU require relevant client checks. If unavailable, finish the useful offline work and state the specific remaining checks. Do not imply that source inspection or mocks establish those outcomes.
