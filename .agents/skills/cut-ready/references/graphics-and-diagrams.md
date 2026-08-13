# Production graphics and technical vector drawings

Use for stickers, decals, vinyl masks, gauge faces, print-and-cut files, and annotated technical diagrams intended for physical production.

## Classify the deliverable

- Distinguish printed artwork, layered solid-color vinyl, a paint mask or stencil, and a printed contour-cut decal. Do not collapse them into one SVG workflow.
- Record finished size, substrate, application surface, viewing face, adhesive side, face-cut or reverse-cut orientation, die-cut or kiss-cut intent, transfer method, and vendor.
- Keep raster imagery at the vendor's required effective resolution at final size. Keep cut contours, registration geometry, and source-exact line art as vectors.
- Preserve the editable master separately from the outlined, expanded, or flattened production export.

## Preserve source fidelity

- Reuse accepted vector glyphs, logos, tick marks, stripe arcs, icons, and other canonical geometry. Do not reconstruct a production master from a similar font or from memory.
- Treat source imagery as evidence. Calibrate it with defensible physical anchors and separate measured geometry from perspective-derived reconstruction.
- Keep canonical repeated geometry mathematically consistent. For example, preserve radii, centers, stroke spacing, angular sweeps, and tick cadence; do not locally distort the system to hide a collision.
- Resolve foreground collisions with an explicit layer or occlusion rule when that matches the source. Preserve the continuous canonical geometry beneath the mask or underprint.

## Separate artwork from operations

Maintain distinct named groups or layers for:

- print artwork and background bleed;
- finished cut contour;
- white, varnish, metallic, or other vendor-supported special ink;
- score, kiss-cut, perf-cut, or through-cut operations;
- registration marks and application guides;
- dimensions, notes, construction geometry, and proof-only overlays.

Do not allow a visible proof stroke to become an unintended cut. Do not let a filled manufacturing contour create a second coincident outline.

## Prepare stickers, decals, and masks

- Retrieve the named vendor's current bleed, safe-area, cutline-name, spot-color, line-weight, file-format, color-profile, transparency, and minimum-feature rules.
- Extend edge-to-edge artwork through the required bleed. Keep critical text and marks inside the required safe area.
- Use a simple closed vector cut contour with deliberate smoothing. Remove accidental nodes, cusps, tiny islands, overlapping cutlines, and narrow notches that cannot cut or weed reliably.
- Inspect clear, metallic, reflective, and specialty substrates against representative light and background colors. Make white-ink and knockout intent explicit.
- For masks and cut vinyl, verify positive versus negative material, retained counters, required bridges, weed direction, registration, transfer tape, and readable orientation after application.
- Treat digital color proofs as approximate unless the vendor supplies a calibrated or physical proof. Preserve declared spot or process colors and embedded profiles without silent conversion.

## Draw technical annotations

- Choose a documented drawing standard or an accepted source drawing and apply it consistently. ISO 128-2:2020 covers line, leader, and reference-line conventions; ASME Y14.2 covers engineering-drawing line and lettering practices, including CAD.
- Route leaders and callouts with straight segments, deliberate angled or orthogonal turns, and sharp corners. Do not introduce curves or radiused elbows unless the source convention requires them.
- Use one consistent arrowhead convention. Make arrowheads fully visible, terminate them at the intended feature, and keep them clear of text, dimensions, outlines, and other arrows.
- Avoid leader crossings and ambiguous endpoints. Reposition labels or reroute leaders instead of accepting overlaps.
- Keep annotation typography, line weight, spacing, capitalization, and alignment consistent with the selected drawing system. Convert final production lettering to paths while retaining an editable text master.
- Do not add a border, bezel, circle, label, symbol, or decorative element absent from the accepted reference or requested scope.

## Run object-level visual QA

1. Render the production export at 1:1, enlarged detail scale, and installed orientation.
2. Create an expected-object inventory by semantic group: glyphs, ticks, stripes, rings, icons, leaders, arrowheads, labels, contours, apertures, and registration marks.
3. Confirm every expected object is visible, unclipped, correctly layered, and within its intended bounds.
4. Run an overlap and near-tangency pass. Inspect actual geometry, not only bounding boxes.
5. Compare against the reference and baseline with transparent overlays or geometry diffs. Explain every intentional delta.
6. When multiple production formats are supplied, verify that their physical bounds and canonical geometry agree. Treat raster previews as non-authoritative.

## Authoritative anchors

- ISO 128-2:2020, line and leader conventions: <https://www.iso.org/standard/69129.html>
- ASME Y14.2, line conventions and lettering: <https://www.asme.org/codes-standards/find-codes-standards/y14-2-line-conventions-lettering>
- Adobe, converting text and appearances to outlines: <https://helpx.adobe.com/illustrator/web/add-and-edit-artwork/create-text/create-outline-text.html> and <https://helpx.adobe.com/illustrator/desktop/manage-objects/arrange-objects/expand-objects.html>

Use these for stable principles. Use the named producer's current official specification for production values.
