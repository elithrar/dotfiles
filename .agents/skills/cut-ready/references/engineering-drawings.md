# Engineering sheets and lettering

Use for dimensioned fabrication drawings, technical annotations, or drawing-only revisions. Keep source geometry authoritative; a sheet-layout correction does not authorize a model change.

## Set the sheet and viewing contract

- Choose an intended standard sheet size, orientation, margins, and view scales before laying out text. Use the requested or accepted drawing standard consistently; do not let an arbitrary pixel canvas determine the paper size. A2 is an option when the content and output workflow warrant it, not a default for every drawing.
- Declare units, datums, projection convention, viewing direction, and workpiece orientation. Distinguish page-left from object-left and projected length from true model length. Use an orthographic or section view for dimensions that an oblique view foreshortens.
- Keep labels to required dimensions, feature specifications, and necessary manufacturing notes. Remove obsolete identifiers and editorial prose. Put provenance and validation detail in the handoff; qualify unresolved assumptions briefly wherever omission would imply verified geometry or fit.

## Verify the actual typeface

- Locate the requested font file and inspect its family, face, version, and license. Check permission for the intended use, embedding, outlining, and redistribution as applicable; installation alone does not establish those rights.
- Verify the required characters in that file and in the actual export, including diameter, degree, multiplication, plus/minus, and unit symbols used by the drawing. Check for missing-glyph boxes, renderer fallback, and incorrect lookalike characters.
- Do not call a substituted font DIN or claim a drawing-standard certification from its appearance. If the requested font is unavailable or unsuitable, report the exact gap; use a free fallback only with approval, honoring any fallback already approved in the conversation. Identify the actual font used in the handoff, without adding a font essay to the sheet.
- Use consistent engineering uppercase for labels while preserving proper case for unit symbols such as `mm`, `N`, and `MPa`, and for case-sensitive technical notation. Do not uppercase every string indiscriminately.
- Embed permitted fonts or outline final lettering as the format requires, retaining an editable master. After export, verify the embedded face or outlined glyphs; a `font-family` declaration or successful text extraction is insufficient.

## Size and place lettering in physical units

Define text roles once, with intended physical cap heights and spacing. For example, a chosen convention might use 2.5 / 3.5 / 5 mm roles; select values for the sheet, process, and required standard instead of treating those examples as mandates. Font size in points is an em size, not the visible cap height.

Use the font's cap metrics or outline bounds to set an initial size, then measure actual exported capital glyphs in sheet millimeters after all transforms. Check representative flat-topped capitals separately from overshooting curves, accents, symbols, and descenders. Measure the full visible label bounds for clearance; neither a nominal font size nor a line-box height proves printed glyph height.

- Generate dimension values and variant names from the shared specification; reconcile them with measured export geometry and actual witness/leader endpoints. A number stored in metadata or repeated in a label is not a geometry measurement.
- Route leaders with consistent straight segments and sharp turns unless the accepted convention requires otherwise. Use one arrowhead convention, terminating at the intended feature with heads fully visible.
- Compute exported text and leader/arrow bounding boxes in sheet coordinates, including stroke widths and a declared clearance. Use intersections as collision candidates, then inspect actual glyphs and segments to distinguish real crossings from harmless empty-box overlap. Check neighboring labels, part outlines, margins, and clipping; reposition annotations rather than distorting the model.

## Review the delivered sheets

1. Reopen the actual PDF/SVG or other drawing export independently. Measure page dimensions, view scales, glyph heights, and critical geometry; compare them with the source contract. Recheck each derivative after any fix.
2. Inspect rendered sheets at the viewer's 100% setting and fit view, plus enlarged details for symbols and leader endpoints. Inspect every sheet, not just a thumbnail or extracted text. A mobile fit view may make correct full-size lettering unreadable; provide a useful detail preview or zoomable vector file without silently enlarging all text or changing the part.
3. Treat 100% as a viewer setting, not proof of physical size. PPI metadata, CSS pixels, and device-pixel ratio do not calibrate a display. Use a measured screen reference or a print at actual size with scaling disabled when physical true-size proof is required; report it as unverified until checked.
4. Have an independent reviewer inspect the raw exports against the brief, accepted base, and dimensional specification. Do not supply only the generator's success report or seeded expected findings. Include missing-feature, wrong-scale, font/glyph, and collision cases when testing a reusable checker; keep development fixtures out of the production package. If independent review is unavailable, state that limit.

## Reference anchors

- [ISO 128-2](https://www.iso.org/standard/69129.html) and [ASME Y14.2](https://www.asme.org/codes-standards/find-codes-standards/y14-2-line-conventions-lettering) for the applicable drawing conventions; verify the required edition before claiming compliance.
- [SVG glyph metrics](https://www.w3.org/TR/SVG2/text.html#GlyphMetrics) and [CSS absolute lengths](https://www.w3.org/TR/css-values-4/#absolute-lengths) for exported text geometry and the limits of screen units.
