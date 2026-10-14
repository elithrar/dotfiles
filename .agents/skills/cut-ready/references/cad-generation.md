# Authoritative geometry and exports

## Encode intent once

Use an accepted native model, parametric source, or reproducible generator with one shared specification. Name controlling dimensions, datums, features, and variants by their physical role. Derive dependent values rather than repeating literals. Select topology by geometry and tolerances rather than transient entity IDs or creation order.

Keep robust topology and intentional physical joins. Distinguish one manufactured piece from separate bodies or assembly parts; do not unite everything merely to obtain one solid. Preserve editable source and source/derivative revision relationships.

A new format is normally an export task. If conversion cannot consume the source, disclose the limitation before substituting geometry. Declare legitimate derivatives such as a flat pattern, simplified tapping representation, machining blank, or print mesh. Compare shared functional invariants and the intended differences; do not demand identical topology across formats or excuse an unrelated change as conversion.

## Make validation independent

Assert expected feature presence and counts before measuring them. An empty loop must not produce a pass. Check applicable topology, closure, continuity, bounds, dimensions, hole/slot positions, thicknesses, clearances, feature coverage, and bend geometry. Verify actual geometry and relationships, not feature names or declared metadata.

Separate expected values from readback measurements. Reusable validators need a valid control and negative cases for a missing feature and a wrong dimension or shape. Hard-coded success flags and copied nominal values are not evidence.

Regenerate the source, export it, and independently read the export. Diagnose warnings and healing. A documented benign topology split may pass if geometry is demonstrably preserved; unexplained changes, lost features/layers, and scale drift may not. Compare critical sections/surfaces as well as dimensions and volume where useful, accounting for declared tessellation or projection loss.

## Keep outputs coherent

Render imported production geometry rather than relying on the source viewport. Preserve operation assignments, units, orientation, and critical features across formats. Record enough source revision, variant, export settings, and file identity to reproduce the tested result without duplicating existing records.

Regenerate affected derivatives and invalidate affected checks after any correction. Verify the delivered/uploaded revision, including a supplied viewer's selected asset. A display defect is not evidence of a CAD defect until compared with the underlying geometry.

Never hide a required bore, floor, opening, or join with a render-only cap or surface. Keep explicitly requested presentation aids separate and exclude them from production output; validate the unobscured part.
