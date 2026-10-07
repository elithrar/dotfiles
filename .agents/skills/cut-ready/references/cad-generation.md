# Deterministic CAD and vector generation

Use when geometry is produced or revised with scripts, CAD APIs, parametric models, or generated SVG/DXF.

## Encode design intent

- Define controlling dimensions, units, datum or origin, material thickness, bend rules, handedness, and revision parameters once. Derive dependent geometry instead of repeating literals.
- Name features and parameters by manufacturing role. Keep hole patterns, slots, bends, canonical glyphs, and repeated geometry reusable.
- Select existing edges, faces, and profiles by geometry plus tolerances. Do not depend on creation order, transient entity IDs, or "first edge" assumptions.
- Build the simplest robust topology. Prefer one continuous base profile and explicit boolean cuts over overlapping tabs, coincident solids, or decorative face patches.

## Preserve model lineage across outputs

Use one chain: accepted base model + shared specification → parameterized variant → production exports → readback measurements, drawing views, and previews. Generate dimension text and tables from the same specification, then compare them with readback measurements. Independent per-format geometry builders can agree on overall bounds while disagreeing on the actual part.

- Revise the base model or its generator; do not repair only a STEP, SVG, PDF, mesh, or preview. A new output format is an export task, not permission to rebuild the part.
- Express variants as named parameter overrides with fixed datums and unchanged-feature assertions. Distinguish overall length from a segment length; derive dependent shoulder positions and dimension endpoints. Preserve physical knurl/texture pitch when body dimensions change unless pitch is explicitly editable; do not stretch the whole part.
- If an export route cannot consume the base model, use a traceable conversion and verify equivalence. If none is available, report that limitation before creating a replacement model.
- Record the base revision, specification/variant, output files, and export settings in the existing handoff or a small manifest. Hashes identify the tested files; they do not prove geometric equivalence.
- Regenerate filenames, variant lengths, dimension lines, labels, tables, and previews together. Do not update a dimension's displayed number while leaving its witness points or geometry stale.

## Assert topology and dimensions

Fail generation when any invariant differs from expectation:

- sketch profile, contour, body, and solid counts;
- closed, connected, non-self-intersecting profiles;
- expected holes, slots, apertures, glyphs, or repeated features;
- positive lengths, radii, thickness, volume, and clearances;
- critical dimensions, center distances, bounds, and symmetry;
- bend count, order, direction, angle, radius, K factor, and stationary face;
- minimum edge, bend-zone, tool, assembly, and service clearances.

Construct rounded slots with a native slot feature or tangent capsule geometry and verify closure, tangency, width, length, and location. Do not trust a visually rounded opening.

Before looping over exported features, assert that every expected feature is present with the required count and role; an empty or incomplete collection must fail. Separate expected values from independently measured readback values in validation results. Copying specification values, declared bounds, or hard-coded success flags into a report is not measurement. Exercise reusable checkers with negative fixtures for a missing feature and an incorrect dimension or shape, as well as a valid control.

## Validate regeneration and export

1. Regenerate from a clean document or deterministic entry point with no warnings.
2. Assert the native model before export.
3. Export from the authoritative model, then parse or import the actual production file independently.
4. Reassert units, bounds, profiles, solids, features, dimensions, orientation, and operation layers on readback.
5. Render the imported export rather than the native viewport.
6. For formed sheet, reconcile folded dimensions, the flat pattern, bend allowance, bend-line order, and slots or holes near bend zones.
7. Stop on importer healing, changed counts, lost layers, malformed paths, or scale drift. Diagnose instead of normalizing the failure.

For multiple outputs, compare each imported variant against the same source revision using agreed units, datums, and process-appropriate tolerances. Check critical feature dimensions and positions, not just bounding boxes; for solids, compare sections or surfaces and volume where useful. Account explicitly for tessellation or projection loss. A view-only mesh derived from the base does not establish print readiness.

After any geometry or annotation fix, invalidate affected downstream checks and rerun them on the regenerated files. Identify the final tested revision in the handoff; do not reuse a successful report from an earlier export.

For fit-sensitive work, pair computational validation with a 1:1 paper, cardboard, or inexpensive-material proof against the actual assembly.
