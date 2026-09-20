# Evaluation record — 2026-09-19

## Method and outcome

This record documents development iterations leading to [f326647](https://github.com/elithrar/dotfiles/commit/f326647ef8b89fe0652bbbd1d9b79c0230109174). The recorded guidance hashes identify the final post-iteration snapshot, not a frozen version supplied to every builder. Subsequent documentation edits do not imply another behavioral evaluation. These files are historical maintainer records, outside the installable skill.

Six fresh builder contexts used `gpt-5.6-luna` and `gpt-5.6-terra` across three rounds. The product prompts in `evals.json` contain 90 and 86 words. Each builder also received the skill path, isolated output path, Lua 5.1 runtime location, output confinement, and reporting instructions; full initial prompts remained within 50–200 words. Round 3 explicitly requested the skill's implementation/review workflow. Grading assertions were withheld from initial builder contexts.

Actual packaged Lua ran under `lupa.lua51`. Independent reviewers traced user handlers, challenged mock assumptions, and executed additional probes. Generated add-ons and executable test harnesses were evaluation work products outside this skill; none are bundled. `run-record.json` records the final source and guidance hashes.

**Final result: both add-ons passed the exercised offline acceptance checks after independent review and repairs.** This is evidence for the complete review-and-repair workflow, not a claim that fresh generation is reliably correct without review. There was no no-skill control arm or token/latency benchmark.

| Round | Luna | Terra | Decision and skill change |
| --- | --- | --- | --- |
| 1 | PackNotes: stale SavedVariables reference, unusable scroll width, absent resize interaction, split UTF-8. | ContextNotes: removed frame APIs, wrong Forever adapter, missing controls, text loss and import-cap gaps. | Rejected despite passing self-tests. Added load lifecycle, client contract, reachable-path, geometry, and consistent validation guidance. |
| 2 | ContextNotes: profile creation overwrote data; hidden-context reopen was stale; global callbacks collided; imports split UTF-8. | PackNotes: minimum-size clipping, incorrect mouse tracking, invalid anchor acceptance and bad coordinate defaults. | Rejected despite passing self-tests. Added acceptance mapping and independent review, namespace/placement ownership, complete input sequences, and minimum-size arithmetic. |
| 3 | PackNotes: independent review repaired scrolling, resize paths, independent placements, metadata, tooltips, scale fitting and display events. | ContextNotes: independent review repaired codec boundaries, editor scrolling, schema preservation, anchor convention and viewport restoration. | Accepted after targeted rechecks. Added signed-caret source guidance, maximum encoded round-trips, bare-scroll-frame navigation, and order-independent layout checks. |

## Final exercised evidence

**Luna / PackNotes:** actual Add/Enter, checkbox, delete, sidebar, slider, launcher, menu and recovery handlers; all 100 notes reachable at 360×260; intact 256-byte Unicode boundary and rejection above it; fresh reload of text, checked state, scale, window anchor and separate minimap position; hidden launcher recovery; full long-note tooltip. Both scale→resize and resize→scale fit an 800×600 viewport. Registered display/UI-scale events restore fit without allocating objects. One hundred sidebar/menu cycles create zero additional objects. Builder smoke checks, Lua parsing and TOC paths pass; metadata is `120100, 16001`.

**Terra / ContextNotes:** actual profile creation/save/deletion and assignments; Retail/Forever context events; manual/automatic selection; fresh reload of notes, manual choice, size and drag position. Unicode, delimiters, newlines, explicit false, empty final fields and a 36,034-byte maximum-expansion export round-trip. Malformed and over-limit imports preserve existing state; replacement at 40 profiles succeeds and creation of a 41st fails. Future database and nested profile schemas remain untouched with incompatible editing blocked. Both editors scroll down and back to the beginning using the verified negative-Y caret contract. A restored/live 1000×800 window fits an 800×600 viewport at inherited scale 1.25 as 780×580. Nonfinite geometry recovers; repeated page/refresh cycles remain 30→30 frames. The builder's 10 behavioral tests, parsing and TOC checks pass.

## What research added beyond generic guidance

Generic Lua knowledge already suggests event-driven work, caching and reuse. The skill spends its detail on less portable facts and failure mechanisms: Forever's modern client family and talent-group semantics; namespace migrations and restricted API contexts; profiler ticks versus seconds; library DB rebinding; unbounded decompression despite asynchronous wrappers; callback generation/reentrancy; retained frame trees; hidden geometry; and storage-scope mistakes demonstrated by upstream commits.

The evals also showed that correct prose alone did not ensure complete implementations. The workflow therefore requires an acceptance map, actual user-handler checks, source-derived mocks, independent review when available, and repair before completion. More generic advice or a longer API encyclopedia would not have addressed that failure.

## Remaining evidence boundary

No live WoW client was available. Native rendering, font wrapping, physical drag/event ordering, combat/taint/secret behavior and measured in-game CPU remain unverified. Offline object counts establish bounded allocation only for the exercised cycles. Activation examples were reviewed against the description, not run as an automated routing benchmark. Re-run affected scenarios and real-client smoke checks for future builds rather than treating this record as permanent certification.
