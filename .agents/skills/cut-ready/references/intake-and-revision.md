# Production intent and revision control

## Establish controlling inputs

Record only what changes the part or requested output:

- Process and stage: cut geometry, formed solid, CNC handoff, print geometry, configured project, or inspected slice.
- Material and exact stock thickness where relevant; finished size, units, quantity, handedness, orientation, and producer.
- Mating interfaces, required fit and tolerances, relevant load direction/environment/failure consequence, assembly and service access.
- Intended physical pieces, CAD-body relationships, permanent joins, removable parts, and usable openings.
- Required finish and edge treatment; whether critical sizes apply before or after finishing and who performs secondary operations.

Reuse known answers. Resolve a geometry-changing unknown before committing that feature; allow labeled reversible exploration. Do not impose a full engineering intake on a cosmetic revision or decorative part.

## Keep evidence honest

Distinguish measured, specified, source-exact, derived, reconstructed, stylistic, and assumed values. Keep consequential calculations reproducible and sources traceable. Do not promote an assumption to a measured fact because a model reproduces it. Track units, reference frames, uncertainty, and the exact surface controlling fit.

For reconstruction, establish defensible scale anchors and perspective limits. Compare silhouette, relative axes/offsets, adjacency/intersections, opening planes, and negative space in comparable views before finalizing. Identify hidden inferred surfaces. Preserve canonical source geometry rather than stretching it to match perspective or lighting. A watertight solid can still represent the wrong object.

For fastening, establish the method and mating hardware: printed or machined thread, insert, captive nut, self-tapping, or clearance as applicable. Separate nominal thread size/pitch/standard and hand/class from bore size, usable engagement, drill depth, and runout. Check surrounding wall/floor, attachment to the base, installation/tool access, and screw bottom-out. Resolve unknown mating geometry before claiming fit.

## Preserve accepted work

Identify the exact baseline, requested delta, frozen elements, and relevant invariants. Keep the original unless replacement was requested. Locate the source rather than rebuilding from a preview without disclosure.

Express variants with explicit units, datums, anchors, and parameter meanings. Preserve feature pitch and size when only body size changes; do not stretch the entire part. For color-only changes, prove geometry unchanged. For local geometry changes, compare unaffected features through geometry diffs or overlays; byte hashes alone may change with serialization.

Translate corrective feedback into an observable acceptance check. Fix the authoritative source and rebuild affected outputs. Preserve deliberate physical or artwork relationships rather than distorting accepted geometry to hide a symptom.
