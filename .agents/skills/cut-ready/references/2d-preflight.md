# 2D production paths

## Preserve physical meaning

Work at 1:1 with explicit units, origin, and orientation. Confirm inside/outside cuts, retained material, holes, separate parts, mirrored variants, and operation intent. Each physical cut needs exactly one authoritative path. Separate cut, score, etch, bend, print, registration, and proof-only content according to the destination's accepted structure.

Use connected closed contours for profile cuts. Check zero-length entities, stray points, coincident duplicates, unintended open paths, self-intersections, and unmerged regions. Preserve deliberate holes and nesting. Open centerlines can be intentional for supported scoring/engraving operations; do not close or expand them indiscriminately.

Export directly from editable source. Use supported primitives; declare approximation tolerances when converting curves and verify resulting shape. Expand strokes or outline text only as the destination requires. Preserve tool-center paths as centerlines and recheck for doubled contours or changed bounds after expansion. Remove unsupported masks, clips, transforms, fonts, raster content, and nonproduction overlays from cut-only exports.

## Verify process feasibility

Compare holes, webs, gaps, notches, radii, and edge distances with the actual process/material/thickness limits. For routing or machining, account for cutter radius and access. Check bend/etch/score operation separation and clearance where relevant. Apply kerf compensation only when assigned to this workflow.

For vinyl and masks, establish positive versus negative material, retained counters, stencil bridges when required, weedability, registration, transfer, face-cut/reverse-cut orientation, and die-cut/kiss-cut intent. Do not add stencil bridges to ordinary printed or separately applied lettering. Check installed readability and minimum features at final physical size.

Ordinary PVC and vinyl must not be assumed laser-safe. Use a suitable plotter/drag-knife process. Verify exact material compatibility with the manufacturer and operator for any proposed laser route; see [Epilog material safety](https://support.epiloglaser.com/staging/laser-machine/fusion-ascent/manual/fire-warning/).

## Readback evidence

From the actual independent import, verify units, transforms, extents, critical dimensions, entity/contour counts, layers, and invalid/open entities. Confirm every production entity maps to its intended action and no proof-only content becomes a cut. Inspect rendered paths and installed orientation; compare revisions with the accepted baseline. State validator coverage honestly: visible layers and a successful render do not establish that the raw file contains no extra entities.
