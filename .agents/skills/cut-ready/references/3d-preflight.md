# STEP and STP preflight

Use for neutral 3D CAD files intended for formed sheet or plate, CNC machining, or another subtractive manufacturing process. This skill does not cover STL or 3MF print-mesh preparation.

## Common STEP rules

- Model at 1:1 scale in explicit inch or millimeter units.
- Export valid B-rep solid geometry. Do not pass a mesh, surface-only model, or empty export as a solid.
- Include the body count the vendor expects. Default to one part and one solid body per file, with no assembly context, unless the vendor explicitly supports assemblies for the requested service.
- Remove hidden bodies, construction surfaces, leftover faces, reference components, and unrelated assembly geometry.
- Orient the part deliberately. Keep a stable face aligned to a principal plane when the vendor requires it.
- Preserve a native or parametric source file so manufacturing revisions do not depend on editing the neutral export.

## Sheet and plate parts

- Use a true sheet-metal body for formed work when the target vendor requires it.
- Model the exact stock thickness offered for the selected material.
- Keep thickness uniform and ensure full faces exist at sheet edges.
- For full-depth sheet cutting, use through-holes and cutouts. Do not model countersinks, counterbores, partial-depth pockets, tapered edges, or other dimensional features unless the service is CNC machining or the vendor explicitly supports them in the selected workflow.
- Model bent flanges in their intended formed state for a STEP bending workflow.
- Use the vendor's current material- and thickness-specific bend radius, K factor, relief, minimum flange, and deformation rules. Do not substitute generic rules.
- Confirm bend angle, direction, stationary face, cosmetic face, and grain direction in the vendor preview when applicable.

## CNC-machined parts

- Check internal corners, pockets, slots, bores, and tool access against current vendor tooling rules.
- Do not model cosmetic threads when the vendor expects simple holes plus a configured tapping service.
- Identify critical tolerances and fits. Do not assume the neutral model communicates a tighter tolerance than the vendor's standard capability.
- Confirm whether edge breaks, deburring, finishing, and inspection requirements require separate configuration or documentation.

## Required validation

Open the exported STEP/STP with an independent CAD kernel or a second CAD application and report:

- File schema and successful parse.
- Units and overall bounding box.
- Body and solid counts.
- Closed or manifold status and positive volume.
- Surface or face count when useful for detecting missing or extra features.
- Uniform sheet thickness for sheet parts.
- Critical dimensions, hole diameters, feature locations, bend angles, and flange orientation.
- Any geometry healing, tolerance warnings, or import changes.

Compare the readback measurements with the native source. Render multiple views of the imported production file, including a view that exposes holes, pockets, and bend direction. A thumbnail or successful vendor upload alone is not sufficient.

## Acceptance checklist

- [ ] Valid STEP/STP structure imports through an independent path.
- [ ] Units, 1:1 scale, and bounding box are correct.
- [ ] Expected solid and body counts match.
- [ ] Geometry is closed, manifold where applicable, and has positive volume.
- [ ] No mesh, surface-only, hidden, empty, or assembly geometry remains.
- [ ] Material stock thickness and manufacturing process match the model.
- [ ] Critical dimensions and feature locations match the manufacturing packet.
- [ ] Sheet-metal and bend rules match the vendor's current values when applicable.
- [ ] Imported production geometry renders correctly from multiple views.
- [ ] Vendor configuration and preview pass, or the handoff is labeled locally preflighted.
