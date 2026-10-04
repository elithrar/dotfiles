# Profiles and transfer

## Storage and selection

Use named profiles and a separate context resolver when switching is requested; simple persistence does not require this architecture. Keep global metadata, character-only state, and portable profile settings separate. Libraries such as [AceDB](https://www.wowace.com/projects/ace3/pages/api/ace-db-3-0) provide storage scopes and profile operations, not an automatic class/spec/instance inheritance policy.

Define selection precedence and manual behavior. A useful default is configured instance/context override, then spec or talent group, class, and shared default. Make automatic/manual mode visible and resolve equal-priority matches deterministically. Use stable class tokens, client-qualified spec IDs, and class-qualified talent-group slots; obtain their meaning through the [client adapter](clients-and-sources.md). Treat unavailable startup identity as unresolved and blank optional selectors as absent.

Keep temporary overrides separate from saved base settings. If layering is needed, define inheritance, explicit `false`, deletion/reset, array replacement, and the destination of edits. Lua's `override or default` cannot preserve a false override, and `pairs()` does not enumerate values supplied only by `__index` defaults.

On profile changes, reconcile mappings and runtime objects, rebind controls and library DB references, and invalidate derived state. Include objects absent from the new configuration. Make create versus replace explicit; preserve existing names unless replacement is requested. Re-resolve current context after any combat deferral.

## Schema and migration

Version the saved schema and use idempotent migrations. Validate login data, inactive profiles when activated, and imports through equivalent rules. Record migration completion explicitly; equality with an old default does not prove the value was never customized. Track explicit choices when future default changes need that distinction. Preserve valid fonts, sizes, positions, colors, and false values across migration and profile copies. If an older schema lacks choice provenance, state the ambiguity and choose a conservative migration instead of silently treating every matching value as untouched.

Validate nested types, finite numbers, ranges, strings, and collection bounds before use. Backfill defaults without sharing mutable tables. Repair individual invalid fields where possible, preserving unrelated valid data. Preserve unsupported future schemas and prevent incompatible writes before normalization can erase them.

Use consistent limits across UI edits, loading, copying, and imports. Apply UTF-8-safe text limits or reject overlong input without destroying the previous value. Check collection limits on creation while allowing valid replacement at capacity.

## Durable session state

Separate session/accounting state from appearance profiles. Define which elapsed time counts for the feature: ordinary idle, loading/zone transitions, reload, and disconnect are distinct cases. A delayed timer callback or world-entry event alone does not establish a disconnect or lost data. Separate clock advancement from evidence that observations are missing; apply an incomplete-data state only when the accounting contract supports it.

Use an appropriate monotonic clock for elapsed intervals within a runtime, and validated wall/server timestamps for cross-runtime recovery policy. Do not carry an old runtime's clock origin into a new one or silently add offline time. Define restoration, intentional reset/logout, and expiry behavior; verify available lifecycle signals on the target client. SavedVariables persistence is controlled by the client: an in-memory checkpoint is not proof it reached disk. Test normal long delays and loading as well as reload/reconnect before changing a gap threshold.

## Import and export

Define a data envelope containing add-on identity, wire-format and schema versions, payload kind, compatibility, and settings. Export portable settings, not runtime objects, proxy views, or unrelated character records. Keep account backups distinct from shareable profiles.

Use a maintained data-only codec. [LibSerialize](https://github.com/rossnichols/LibSerialize#readme) with [LibDeflate](https://github.com/SafeteeWoW/LibDeflate#readme) is one option; a bounded plain-data format can suit a small schema. Verify current codec and encoding contracts. Never evaluate an import string as Lua, even in an empty environment or under `pcall`.

Decode, validate, and migrate into temporary data, then commit atomically. Reject unsupported schemas, incompatible payloads, malformed structure, ambiguous fields, excessive nesting, and non-finite values without changing existing state. Round-trip Unicode, explicit false, empty fields, and the largest accepted payload including encoded expansion.

Bound input and decoded work. A post-decompression size check cannot limit peak allocation inside an unbounded decoder, and a coroutine cannot interrupt a synchronous call. Choose enforced bounds when needed or make the residual limitation explicit.
