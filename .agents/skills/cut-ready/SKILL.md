---
name: cut-ready
description: Create, revise, or preflight fabrication files for 2D cutting, physical graphics, formed parts, CNC machining, and 3D printing. Use for CAD solids, cut paths, print meshes, slicer handoffs, fit, and production requirements; not standalone technical documentation, digital-only graphics, NC-program qualification, or machine operation.
---

# Cut-ready fabrication

Deliver physical-part geometry that preserves design intent and is verified for its stated production stage. File validity, downstream interpretation, and physical qualification are separate claims. For audit-only work, report findings without changing or uploading artifacts.

## Route by deliverable

Load only the references needed for the next decision:

- Missing controlling inputs, reconstruction, or revision scope: [intake and revision](references/intake-and-revision.md).
- Parametric/scripted geometry, variants, or new export formats: [CAD generation](references/cad-generation.md).
- Profile cutting, vinyl, stencils, or operation paths: [2D preflight](references/2d-preflight.md).
- Printed physical artwork and contour-cut products: [production graphics](references/production-graphics.md).
- Solid CAD, formed sheet, or CNC parts: [3D preflight](references/3d-preflight.md).
- Print meshes, configured slicer projects, or inspected slices: [additive preflight](references/additive-preflight.md).
- Producer requirements, finishing, upload previews, or physical proofs: [vendor handoff](references/vendor-handoff.md).

## Required outcomes

1. **Define the part and production stage.** Establish process, material/stock, units, critical geometry, interfaces, tolerances, finish, and target producer as relevant. Distinguish CAD bodies from separate physical parts and intended joins. Reuse accepted inputs; ask only when an unknown controls the next geometry, fit, output, or safety decision. Continue independent work with clearly bounded assumptions.
2. **Preserve design authority.** Identify the accepted base and controlling specification. Derive variants and exports from them; freeze everything outside the requested revision. Declare process-specific transformations rather than silently rebuilding or changing the part. Keep measured, specified, calculated, reconstructed, and assumed inputs distinguishable.
3. **Prove the final geometry.** Independently import/read the actual exported bytes. Compare units, transforms, bounds, topology, expected feature inventory, critical dimensions, orientation, and operation assignments with the specification. Measure features rather than copying nominal values into a report. Diagnose missing features, unexplained healing, or changed geometry before accepting the file.
4. **Inspect the actual result.** Render the imported export from views or sections that expose its critical shapes, coverage, openings, and clearances. Compare reference-derived work in comparable views, including adjacency, axes, silhouette, and negative space. Separate geometry defects from tessellation, normals, or display artifacts; a convincing preview does not prove the part is correct.
5. **Verify the requested downstream stage.** Apply the selected process checks. Use current official requirements for the exact producer, material, and service where they affect the result. Inspect actual vendor/slicer interpretation when that stage is requested and available. Never infer printability, machining simulation, or physical fit from a successful import.
6. **Release the exact checked revision.** After corrections, regenerate derivatives and repeat affected checks. For substantial or consequential geometry changes, obtain an independent review of the brief, source evidence, and raw exports without seeding expected findings; report if unavailable. Deliver the requested files, editable source when needed, useful preview, and concise evidence/gaps. Verify a hosted preview or uploaded artifact identifies the same part, variant, and revision.

## Boundaries

- Preserve the original and explain any manufacturing change outside scope before making it. A format conversion is not permission to redesign.
- Use source-backed process limits. Do not invent tolerances, clearances, bend rules, tooling limits, or printer settings. Do not apply kerf, shrink, bend, or finish compensation unless the workflow explicitly requires it; prevent double compensation.
- Do not laser-process ordinary PVC/vinyl. Use a suitable non-laser route unless the exact material and machine operator explicitly establish laser compatibility.
- Keep production geometry free of proof-only overlays and render-only repairs. Do not conceal missing physical features with caps, shading, or hidden bodies.
- Upload, order, proof approval, and machine execution are separate actions. Stay within the user's authorization; this skill does not authorize them.

## Handoff status

Give a concise status for each materially different artifact/process, followed by passed checks and material gaps:

- **Ready for the stated stage:** All applicable digital and downstream checks for that named stage passed. Name the stage, such as cut-file handoff or inspected slice; do not imply physical qualification.
- **Locally preflighted:** Geometry/export checks passed; required vendor, slicer, or other downstream interpretation remains unverified.
- **Draft / reconstruction:** Intent or controlling inputs remain provisional.
- **Blocked for the stated stage:** A missing input or failed check can materially change the part or make that stage unsafe.

Report fit/performance proof separately as performed, unperformed, or not applicable with a reason. Where uncertainty or failure consequence warrants a physical proof, identify the relevant coupon, prototype, or first-article check. A digital pass cannot stand in for it; honest limited-stage delivery may still proceed.
