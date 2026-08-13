# Deterministic CAD and vector generation

Use when geometry is produced or revised with scripts, CAD APIs, parametric models, or generated SVG/DXF.

## Encode design intent

- Define controlling dimensions, units, datum or origin, material thickness, bend rules, handedness, and revision parameters once. Derive dependent geometry instead of repeating literals.
- Name features and parameters by manufacturing role. Keep hole patterns, slots, bends, canonical glyphs, and repeated geometry reusable.
- Select existing edges, faces, and profiles by geometry plus tolerances. Do not depend on creation order, transient entity IDs, or "first edge" assumptions.
- Build the simplest robust topology. Prefer one continuous base profile and explicit boolean cuts over overlapping tabs, coincident solids, or decorative face patches.

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

## Validate regeneration and export

1. Regenerate from a clean document or deterministic entry point with no warnings.
2. Assert the native model before export.
3. Export from the authoritative model, then parse or import the actual production file independently.
4. Reassert units, bounds, profiles, solids, features, dimensions, orientation, and operation layers on readback.
5. Render the imported export rather than the native viewport.
6. For formed sheet, reconcile folded dimensions, the flat pattern, bend allowance, bend-line order, and slots or holes near bend zones.
7. Stop on importer healing, changed counts, lost layers, malformed paths, or scale drift. Diagnose instead of normalizing the failure.

For fit-sensitive work, pair computational validation with a 1:1 paper, cardboard, or inexpensive-material proof against the actual assembly.
