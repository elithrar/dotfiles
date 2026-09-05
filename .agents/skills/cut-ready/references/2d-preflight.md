# 2D cut-file preflight

Use for DXF, DWG, SVG, PDF, AI, EPS, and other physically produced vectors. Also load `graphics-and-diagrams.md` when the file contains printed artwork, masks, typography, annotations, leaders, or dense visual geometry.

## Authoring rules

- Work at 1:1 scale in explicit inch or millimeter units.
- Define a stable physical origin, artboard or page size, and coordinate system. Do not rely on a viewer's fit-to-page behavior or on SVG pixels as evidence of physical size.
- Keep one physical part per production file when the vendor requires it. Put mirrored or handed variants in separate files unless a combined sheet is explicitly requested and accepted.
- Export directly from the native vector or CAD source. Avoid online file converters.
- Use closed, connected contours for profile cuts. Remove zero-length entities, stray points, duplicate or stacked lines, unintended open paths, and self-intersections.
- Unite adjacent shapes that should be one piece. Preserve deliberate holes and nested contours.
- Separate semantic operations: cut, score, etch, bend, print artwork, cut contour, white ink, registration, proof-only annotation, and construction geometry. Export only the operations the target workflow accepts.
- Keep exactly one authoritative entity for each physical cut. Avoid coincident duplicates created by fill-and-stroke artwork, expanded strokes, nested exports, or copied layers.
- Convert production text to outlines or paths while preserving editable text in the source. Add bridges only when a stencil or retained physical web requires them; do not stencilize ordinary printed or individually applied lettering without need.
- Expand visual strokes and appearances only when the target format or vendor requires stable outlined geometry. Keep tool-center cut paths as single centerlines; after expansion, check for doubled contours and changed bounds.
- Remove unsupported fonts, masks, clips, transforms, raster images, hidden construction geometry, dimensions, notes, and title blocks unless the target process explicitly uses them.
- Do not add kerf compensation unless the vendor or machine workflow requires customer-compensated geometry.

## Process checks

### Profile cutting

- Confirm the intended inside and outside contours.
- Compare every hole and narrow web with the current material and process minimums.
- Check sharp internal corners against the process. Router and machining operations require tool-radius allowances.
- Keep etch, bend, score, and cut entities separated exactly as the vendor specifies.
- Prefer simple supported primitives. If splines, effects, or compound paths must be approximated, record the conversion tolerance and compare the converted geometry with the master.

### Vinyl and graphics

- Prefer a drag-knife or plotter for ordinary vinyl and PVC. Do not assume laser compatibility.
- Follow laser-manufacturer safety guidance: Epilog explicitly prohibits cutting PVC, vinyl, and other chlorine-containing material because the process creates corrosive and toxic gases: <https://support.epiloglaser.com/staging/laser-machine/fusion-ascent/manual/fire-warning/>
- Verify the finished physical dimensions and whether the job is layered solid-color vinyl or a printed, laminated contour-cut decal.
- For layered work, provide separate color files and deliberate registration marks outside the finished art.
- For printed contour cuts, distinguish the artwork bleed from the finished cut line and verify that the vendor preview adds no unwanted white or transparent border.
- Inspect minimum feature size and weedability at 1:1 scale.
- Confirm whether the physical cut is die-cut through the liner, kiss-cut through the face stock, or a tool-center mask cut; the same visible outline can require different production data.

### Mirrored and reverse-cut work

- Label face-cut, reverse-cut, left, and right variants unambiguously.
- Confirm whether text should read normally in the file, after cutting, or after application.
- Render the installed orientation for review.

## Required validation

1. Reopen the exported production file in a second compatible application or independent parser.
2. Report detected units, origin, page or extents, entity and contour counts, layer names, and open or invalid entities.
3. Compare the export bounds and critical dimensions with the source values.
4. Render the production export and inspect it visually.
5. For a revision, overlay or compare it with the accepted baseline and identify only the intended delta.
6. If a vendor is named, apply its current rules. Run preview checks when upload access and authorization are available; otherwise identify that unverified gate without blocking local delivery.
7. Verify that every production entity maps to one intended physical action and that proof-only graphics cannot be mistaken for cut geometry.

Do not claim that mapped contours, visible layers, or a successful render prove the raw file has no extra entities. Report the exact scope of every validator used.

## Acceptance checklist

- [ ] Units and 1:1 scale are explicit and correct.
- [ ] Bounds and critical dimensions match the manufacturing packet.
- [ ] Only intended cut and service geometry remains.
- [ ] Each intended physical action has one authoritative entity with no coincident duplicate.
- [ ] Required contours are closed and connected.
- [ ] No duplicate, stacked, zero-length, stray, or self-intersecting geometry remains.
- [ ] Text is converted or handled according to the vendor's rule.
- [ ] Minimum holes, webs, gaps, and radii meet current process and material rules.
- [ ] Mirroring, handedness, layers, and service lines are correct.
- [ ] Independent import and production-export rendering pass.
- [ ] The named vendor preview passes, or the handoff is labeled locally preflighted.
