---
name: cut-ready
description: Create, revise, audit, or package fabrication-ready 2D vector and 3D CAD files for laser, waterjet, router, drag-knife, sheet-metal bending, or CNC vendor upload. Load for DXF, SVG, AI, EPS, STEP, or STP deliverables; SendCutSend and similar vendor preparation; scale, material, thickness, bend, or cut-path decisions that affect geometry; and tightly scoped production revisions such as "change only this." Do not load for visual mockups, 3D-print mesh work, or general CAD instruction without a fabrication-ready output.
---

# Cut-ready fabrication

Treat `cut-ready` as a verified status, not a synonym for "file created." Do not claim it until the applicable evidence, geometry, readback, visual, and vendor gates pass.

## Load the required references

| Work | Reference |
|---|---|
| Establish dimensions, source confidence, and a revision contract | `references/intake-and-revision.md` |
| Create or review 2D cut geometry | `references/2d-preflight.md` |
| Create or review STEP/STP geometry | `references/3d-preflight.md` |
| Prepare a vendor handoff or SendCutSend upload | `references/vendor-handoff.md` |

Load every reference that applies. Re-check the named vendor's current official requirements when material, thickness, minimum-feature, tolerance, bend, or file-format rules could have changed.

## Workflow

1. **Classify the manufacturing job.** Identify 2D profile or graphic cutting, formed sheet material, or machined 3D solid. Record the process, material, stock thickness, units, quantity, finish, critical dimensions, tolerances, handed or mirrored variants, and target vendor when known. Ask one focused question only when a missing answer changes the geometry, format, or safety.
2. **Build an evidence ledger.** Label each important dimension or shape as measured, supplied, primary-source specified, reconstruction-derived, or stylistic. Never turn a photo estimate into an exact historical or physical dimension. State the scale anchor, perspective limits, and uncertainty for reconstructions.
3. **Freeze accepted work.** Before a revision, record the baseline, frozen elements, editable elements, invariants, and acceptance checks. Create a new revision unless the user explicitly asks to replace the baseline. Treat "change nothing else" literally.
4. **Create a deterministic source of truth.** Prefer native CAD, a parametric model, or a checked-in generator over hand-edited exports. Reuse accepted components and canonical assets. Export directly from the source tool rather than through an online converter.
5. **Run technical preflight.** Apply the 2D or 3D checklist. Open the exported file in a second compatible tool or independent import path. Compare units, bounds, body or contour counts, orientation, and critical dimensions with the source.
6. **Run visual and semantic review.** Render the actual production export. Compare it with the source and, for revisions, with the accepted baseline. Inspect negative space, overlaps, mirrored text, cut direction, feature placement, and the user's requested composition. A parser-only check is insufficient.
7. **Verify the manufacturing handoff.** When the vendor is named, use its current official design rules. If authorized and available, upload the file without ordering and inspect the vendor preview. Confirm displayed size, material, thickness, services, bend directions, and feature count. Never place an order or approve production without explicit authorization.
8. **Package the result.** Include production files, editable source or generator, a rendered preview, a short README, and a validation report. State assumptions, reconstruction uncertainty, material and process, stock thickness, units, revision scope, checks passed, and checks not completed.

## Guardrails

- Stop before geometry generation when process, material, thickness, or a critical dimension is unknown and cannot be recovered from supplied evidence.
- Do not invent vendor limits, tolerances, bend radii, K factors, kerf values, historical dimensions, or missing geometry. Retrieve current primary-source rules or report the blocker.
- Do not compensate for kerf, bend allowance, or finishing unless the manufacturing workflow explicitly requires it.
- Do not describe ordinary PVC or automotive vinyl as laser-safe. Default to a drag-knife or plotter unless the exact material manufacturer and machine operator explicitly approve laser processing.
- Do not silently simplify, redraw, rescale, mirror, repair, or convert accepted geometry. Explain any required manufacturing change and preserve the original.
- Do not call a STEP file valid merely because it has a `.step` extension, or a DXF valid merely because it opens. Require geometry and readback checks.
- Do not treat a vendor's successful upload as proof that scale, bend direction, or design intent is correct. Inspect the preview and configuration.

## Readiness labels

Use exactly one status in the final handoff:

- **Cut-ready:** All applicable local preflight, independent readback, visual review, and named-vendor preview checks passed.
- **Locally preflighted:** Local and independent checks passed, but vendor import or physical proof remains unverified.
- **Draft / reconstruction:** Geometry depends on unconfirmed dimensions, photo inference, or unresolved aesthetic approval.
- **Blocked:** A missing manufacturing input or failed check can materially change the part.

Report the status first, followed by the production files, intended process and material, exact passed checks, remaining proof step, and any uncertainty.
