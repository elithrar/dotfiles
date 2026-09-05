---
name: cut-ready
description: Prepare or review CAD and vector artwork for physical fabrication, cutting, printing, or machining. Use for production files, scale, contours, fit, bends, and vendor handoff; not digital-only graphics, 3D-print meshes, or CAD explanation without a production artifact.
---

# Cut-ready fabrication

Treat `cut-ready` as a verified status, not a synonym for "file created." Do not claim it until the applicable evidence, geometry, readback, visual, and vendor gates pass. For an audit-only request, report findings and readiness without modifying or uploading files.

## Load the required references

| Work | Reference |
|---|---|
| Establish dimensions, source confidence, and a revision contract | [intake-and-revision](references/intake-and-revision.md) |
| Create or review 2D cut geometry | [2d-preflight](references/2d-preflight.md) |
| Create stickers, decals, masks, gauge faces, or annotated vector drawings | [graphics-and-diagrams](references/graphics-and-diagrams.md) |
| Generate CAD or vector geometry programmatically | [cad-generation](references/cad-generation.md) |
| Create or review STEP/STP geometry | [3d-preflight](references/3d-preflight.md) |
| Prepare a vendor handoff or SendCutSend upload | [vendor-handoff](references/vendor-handoff.md) |

Read a reference when its manufacturing decision or validation step is needed; do not load every file for a narrow revision. Re-check the named vendor's current official requirements when material, thickness, minimum-feature, tolerance, bend, or file-format rules could have changed.

## Workflow

1. **Classify the production job.** Identify flat profile cutting, cut vinyl or stencil, printed contour-cut artwork, production vector drawing, formed sheet material, or machined 3D solid. Record the process, physical substrate or stock, thickness when relevant, units, finished size, quantity, finish, critical dimensions, tolerances, application face, handed or mirrored variants, and target vendor when known. Ask one focused question only when a missing answer changes geometry, output, fit, or safety.
2. **Build an evidence ledger.** Label each important dimension or shape as measured, supplied, source-exact, primary-source specified, reconstruction-derived, or stylistic. Never turn a photo estimate into an exact historical or physical dimension. State the scale anchor, perspective limits, and uncertainty for reconstructions.
3. **Freeze accepted work.** Before a revision, record the baseline, frozen elements, editable elements, invariants, and acceptance checks. Create a new revision unless the user explicitly asks to replace the baseline. Treat "change nothing else" literally.
4. **Create a deterministic source of truth.** Prefer native CAD, a parametric model, or a checked-in generator over hand-edited exports. Reuse accepted components and canonical assets; define repeated diagram primitives and visual roles once. Encode controlling dimensions and expected feature counts as assertions. Export directly from the source tool rather than through an online converter.
5. **Run technical preflight.** Apply every relevant reference. Open the exported file in a second compatible tool or independent import path. Compare units, physical bounds, layers, bodies, contours, features, orientation, and critical dimensions with the source. Treat unexpected counts or importer healing as failures to diagnose.
6. **Run visual and semantic review.** Render the actual production export at actual size and useful magnifications. Inventory every visible object and inspect negative space, alignment, z-order, occlusion, overlaps, arrow and leader termination, mirrored text, cut direction, feature placement, and installed orientation. Compare with source references and, for revisions, the accepted baseline. A parser-only check is insufficient.
7. **Verify the manufacturing handoff.** When the vendor is named, use its current official design rules. If authorized and available, upload the file without ordering and inspect the vendor preview. Confirm displayed size, material, thickness, services, bend directions, and feature count. Never place an order or approve production without explicit authorization.
8. **Package the result.** Return the requested production files with the source and preview needed to use or verify them. Summarize relevant process, units, assumptions, checks, and gaps in the handoff. Add a separate README or validation report only for a requested package or when manufacturing details would otherwise be lost.

## Guardrails

- Resolve missing inputs before the geometry decision they control. Complete independent edits and checks first; a color-only revision of accepted artwork need not re-open unchanged material or dimensional decisions. Preserve prior authorization and the user's requested scope. Explain any actual blocking instruction and the affected decision.
- Do not invent vendor limits, tolerances, bend radii, K factors, kerf values, historical dimensions, or missing geometry. Retrieve current primary-source rules or report the blocker.
- Do not compensate for kerf, bend allowance, or finishing unless the manufacturing workflow explicitly requires it.
- Do not describe ordinary PVC or automotive vinyl as laser-safe. Default to a drag-knife or plotter unless the exact material manufacturer and machine operator explicitly approve laser processing.
- Do not silently simplify, redraw, rescale, mirror, repair, or convert accepted geometry. Explain any required manufacturing change and preserve the original.
- Do not use a vendor-specific cutline name, spot color, bleed, safe area, resolution, or color mode as a universal rule. Retrieve the named vendor's current specification.
- Do not call a STEP file valid merely because it has a `.step` extension, or a DXF valid merely because it opens. Require geometry and readback checks.
- Do not treat a vendor's successful upload as proof that scale, bend direction, or design intent is correct. Inspect the preview and configuration.

## Readiness labels

Use exactly one status in the final handoff:

- **Cut-ready:** All applicable local preflight, independent readback, visual review, and named-vendor preview checks passed.
- **Locally preflighted:** Local and independent checks passed, but vendor import or physical proof remains unverified.
- **Draft / reconstruction:** Geometry depends on unconfirmed dimensions, photo inference, or unresolved aesthetic approval.
- **Blocked:** A missing manufacturing input or failed check can materially change the part.

Report the status first, followed by the production files, intended process and material, exact passed checks, remaining proof step, and any uncertainty.
