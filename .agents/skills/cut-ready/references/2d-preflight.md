# 2D cut-file preflight

Use for DXF, DWG, SVG, AI, EPS, and other 2D production vectors.

## Authoring rules

- Work at 1:1 scale in explicit inch or millimeter units.
- Keep one physical part per production file when the vendor requires it. Put mirrored or handed variants in separate files unless a combined sheet is explicitly requested and accepted.
- Export directly from the native vector or CAD source. Avoid online file converters.
- Use closed, connected contours for profile cuts. Remove zero-length entities, stray points, duplicate or stacked lines, unintended open paths, and self-intersections.
- Unite adjacent shapes that should be one piece. Preserve deliberate holes and nested contours.
- Convert production text to outlines or paths. Add bridges to reversed cut text that must remain a single physical piece.
- Remove unsupported fonts, live strokes, masks, clips, transforms, raster images, hidden construction geometry, dimensions, notes, and title blocks unless the target process explicitly uses them.
- Do not add kerf compensation unless the vendor or machine workflow requires customer-compensated geometry.

## Process checks

### Profile cutting

- Confirm the intended inside and outside contours.
- Compare every hole and narrow web with the current material and process minimums.
- Check sharp internal corners against the process. Router and machining operations require tool-radius allowances.
- Keep etch, bend, score, and cut entities separated exactly as the vendor specifies.

### Vinyl and graphics

- Prefer a drag-knife or plotter for ordinary vinyl and PVC. Do not assume laser compatibility.
- Verify the finished physical dimensions and whether the job is layered solid-color vinyl or a printed, laminated contour-cut decal.
- For layered work, provide separate color files and deliberate registration marks outside the finished art.
- For printed contour cuts, distinguish the artwork bleed from the finished cut line and verify that the vendor preview adds no unwanted white or transparent border.
- Inspect minimum feature size and weedability at 1:1 scale.

### Mirrored and reverse-cut work

- Label face-cut, reverse-cut, left, and right variants unambiguously.
- Confirm whether text should read normally in the file, after cutting, or after application.
- Render the installed orientation for review.

## Required validation

1. Reopen the exported production file in a second compatible application or independent parser.
2. Report detected units, extents, entity and contour counts, layer names, and open or invalid entities.
3. Compare the export bounds and critical dimensions with the source values.
4. Render the production export and inspect it visually.
5. For a revision, overlay or compare it with the accepted baseline and identify only the intended delta.
6. If a vendor is named, run the vendor preview checks in `vendor-handoff.md`.

Do not claim that mapped contours, visible layers, or a successful render prove the raw file has no extra entities. Report the exact scope of every validator used.

## Acceptance checklist

- [ ] Units and 1:1 scale are explicit and correct.
- [ ] Bounds and critical dimensions match the manufacturing packet.
- [ ] Only intended cut and service geometry remains.
- [ ] Required contours are closed and connected.
- [ ] No duplicate, stacked, zero-length, stray, or self-intersecting geometry remains.
- [ ] Text is converted or handled according to the vendor's rule.
- [ ] Minimum holes, webs, gaps, and radii meet current process and material rules.
- [ ] Mirroring, handedness, layers, and service lines are correct.
- [ ] Independent import and production-export rendering pass.
- [ ] The named vendor preview passes, or the handoff is labeled locally preflighted.
