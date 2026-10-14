---
name: engineering-drawings
description: Create, revise, or rigorously review electrical termination and wiring diagrams, engineering BOMs, mechanical part and housing drawings, and 2D views of 3D models. Use for engineering drawing structure, symbols, connections, projections, dimensions, tolerances, and export review; not presentation graphics or fabrication-process qualification alone.
---

# Engineering drawings

Make drawings a builder or inspector can use without guessing. Treat visual clarity, technical correctness, and completeness as separate acceptance requirements. Do not substitute a polished illustration for an engineering document. For review-only work, report findings and required corrections without modifying or uploading artifacts unless requested.

## Choose the document

Establish the intended use and accepted baseline before drawing: functional schematic, physical termination diagram, arrangement/assembly drawing, or dimensioned part drawing. Preserve requested functions and revision scope; do not add hardware or redesign an accepted part to make a sheet easier to draw.

- For wiring and termination work, read [electrical](references/electrical.md).
- For housings, physical parts, and 2D views of 3D parts, read [mechanical](references/mechanical.md).
- For a required convention or compliance claim, consult [standards](references/standards.md).

Reuse known inputs. Ask only for missing information that controls the next consequential decision. Mark unresolved information where it affects interpretation; continue independent work. A concept may omit unresolved details if clearly limited; a build/inspection drawing may not silently depend on them.

## Establish the source of truth

1. Identify the actual assembly/model, variant, revision, interfaces, and source documents. Resolve conflicting evidence rather than blending revisions. Preserve accepted geometry and content on narrow revisions.
2. Establish exact parts and their interfaces before committing a termination layout; establish current model geometry before dimensioning a part. Keep manufacturer markings, assigned identifiers, measured values, specified values, calculations, and assumptions distinguishable.
3. Maintain a compact controlling specification: terminal-to-terminal schedule for wiring; model/dimension/feature requirements for parts; BOM for assemblies. Derive artwork and callouts from it, but verify the export independently rather than trusting the generator's declarations.
4. Trace consequential values to primary technical data or reproducible calculations. A receipt establishes what was purchased, not the applicable hardware revision, pinout, fit, or rating. Do not invent missing dimensions, tolerances, component limits, or approvals.

## Compose the sheets

- Select physical page size, orientation, view scale, and reading size before layout. Use the fewest sheets that remain legible. Keep a small termination assembly coherent on one sheet when practical; split only for clarity, with explicit cross-references.
- Use a restrained border, actual project/part title, sheet identity, revision, date, and author. Keep a short revision table and blank future rows when useful. Do not invent document numbers, checkers, approval signatures, or certification.
- Default to monochrome technical linework, consistent symbols, and clear line-weight hierarchy. Use technical uppercase labels and a clean engineering/monospace face unless the accepted convention differs. Preserve case-sensitive units, formulas, and actual identifiers. Identify a fallback honestly; a DIN-like font is not proof of DIN compliance.
- Distinguish geometry, conductors, hidden features, centers, boundaries, dimensions, and leaders. Terminate leaders precisely. Avoid decorative boxes, prose panels, and excessive metadata.
- Verify the actual requested font and permitted embedding, outlining, or redistribution. If unavailable, obtain approval for a substitute unless a fallback is already authorized.
- Size lettering in physical sheet units. Verify exported glyphs, symbols, and clearances, including font substitution. A font-family declaration or anchor coordinate does not establish the visible result. Move annotations or reroute conductors; never mask an ambiguous connection with a white text box.
- State units and scales unambiguously; label diagrammatic/not-to-scale views. Keep notes short and actionable. Put lengthy evidence and qualification procedures beside the drawing, not over it.
- For a BOM sheet, include reference/item, exact part number, quantity with basis/unit, supplier when requested, short description, and essential notes. Account for all required assembly parts, not only headline devices. Identify included kit contents, separate contacts/accessories, and unselected items without double counting. Keep each BOM note under 12 words; refer to a numbered technical note for essential detail that cannot fit.

## Mandatory release gates

Record each applicable gate as PASS, FAIL, or UNVERIFIED with concise evidence tied to the exact output revision. Use N/A only with a reason. Missing evidence is not PASS; a checklist tick or generator assertion is not evidence.

1. **Purpose and scope:** The document answers the requested build/inspection question; required functions, interfaces, and accepted invariants are retained. A schematic alone fails a request for physical terminations.
2. **Technical definition:** The relevant electrical/mechanical checks pass. Every controlling connection or feature is unambiguous and supported. Unknowns that can change build or safety prevent build-ready status.
3. **Internal agreement:** Views, terminal schedules, dimensions, identifiers, quantities, descriptions, notes, BOM, and model/source agree. Trace every endpoint or critical feature both ways. Stale text fails even when the source data is correct.
4. **Export and pixels:** Reopen the actual final export through an independent reader/render path. Check page size, units, scale, orientation, and content against source. Inspect every rendered sheet at intended reading size and enlarged critical details. Reject clipped or missing glyphs, collisions, hidden endpoints, ambiguous crossings, detached leaders, and unreadable density. Text extraction and geometry checks supplement, never replace, pixel inspection. Viewer “100%” is not calibrated physical size.
5. **Independent challenge:** For a new or materially revised drawing, obtain a fresh reviewer who receives the brief, primary inputs, and raw final exports, not the author's verdict or a list of expected defects. Review technical meaning and drafting separately. Require specific locations and evidence, investigate disputed findings against source and pixels, and correct genuine defects before delivery. Pass this release gate only after material findings are resolved and rechecked. If independent review is unavailable, mark this gate UNVERIFIED.
6. **Final identity and recheck:** After any correction, regenerate dependent outputs and repeat every check the change could invalidate, including rendered review. Deliver only the exact reviewed revision. If uploaded/published, verify the returned asset or served version and remove conflicting obsolete instructions within authorized scope. Do not reuse a previous PASS for a changed file.

## Handoff

Lead with drawing-review status and deliver the requested editable/vector artifact plus a readable render. State material unresolved inputs and the next required proof succinctly; put intended-use restrictions on the artifact itself where a detached copy could otherwise mislead. Do not offload fixable drawing defects as user homework.

- **Drawing review PASS:** All applicable gates passed for the stated purpose. Name that purpose, such as concept, prototype assembly, or build/inspection.
- **Draft / UNVERIFIED:** An applicable gate lacks evidence; identify what remains and restrict use accordingly.
- **FAIL / blocked for intended use:** A contradiction or defect can mislead manufacture, assembly, or inspection; correct it before release for that use.

Report physical qualification separately: fit, load, thermal behavior, workmanship, environmental rating, and regulatory approval require their own evidence. A reviewed drawing, a recognized symbol, or professional styling establishes none of these by itself.
