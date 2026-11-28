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
- For Australian work, an owner drafting standard, or a compliance claim, consult [standards and owner examples](references/standards.md).

Reuse known inputs. Ask only for missing information that controls the next consequential decision. Mark unresolved information where it affects interpretation; continue independent work. A concept may omit unresolved details if clearly limited; a build/inspection drawing may not silently depend on them.

## Establish the source of truth

1. Identify the actual assembly/model, variant, revision, interfaces, and source documents. Reconcile the last accepted drawing, later owner corrections, measured evidence, and actual orders. Treat old drawings and carts as historical. Preserve unaffected content.
2. Establish exact parts and their interfaces before committing a termination layout; establish current model geometry before dimensioning a part. Keep manufacturer markings, assigned identifiers, measured values, specified values, calculations, and assumptions distinguishable.
3. Maintain a compact controlling specification: terminal-to-terminal schedule for wiring; model/dimension/feature requirements for parts; BOM for assemblies. Derive artwork and callouts from it, but verify the export independently rather than trusting the generator's declarations.
4. Trace consequential values to primary technical data or reproducible calculations. A receipt establishes what was purchased, not the applicable hardware revision, pinout, fit, or rating. Do not invent missing dimensions, tolerances, component limits, or approvals.

## Compose the sheets

- Select physical page size, orientation, view scale, and reading size before layout. Use the fewest sheets that remain legible. Keep a small termination assembly coherent on one sheet when practical; split only for clarity, with explicit cross-references.
- Use a restrained border, actual project/part title, sheet identity, revision, date, and author. Keep a short revision table and blank future rows when useful. Do not invent document numbers, checkers, approval signatures, or certification.
- Use the owner's lettering and line conventions where specified. Otherwise use technical uppercase labels and a legible engineering or monospace face. Use consistent line weights and symbols that read in monochrome. Preserve the exact case of identifiers and units (e.g. `0.75 mm²`, `24 V`, `mA`) in the export, including uppercase table styles.
- Distinguish geometry, conductors, hidden features, centres, boundaries, dimensions and leaders. Terminate leaders precisely. Give the drawing most of the sheet. Key unfamiliar symbols near the view or in a compact legend.
- Verify the actual requested font and permitted embedding, outlining, or redistribution. If unavailable, obtain approval for a substitute unless a fallback is already authorized.
- Size lettering in physical sheet units. Verify exported glyphs, symbols, and clearances, including font substitution. A font-family declaration or anchor coordinate does not establish the visible result. Move annotations or reroute conductors; never mask an ambiguous connection with a white text box.
- Label diagrammatic views and state scales and units where applicable. Give each table a purpose and explicit headings. Put shared units in the header, keep each identifier intact and repeat headers and the assembly identity across continuations. Check the longest tag, part number and note in the exported cells at the smallest intended print size.

## Decide what belongs on the drawing

- Put a connection in the view or terminal row, a value at its feature or in its column, and a symbol definition in the legend. Use a note when the reader still needs a condition, action or exception. Place it at the affected item. If space or repetition warrants a keyed note, put its number at each applicable location and check the references both ways. Reserve general notes for information that applies throughout the stated sheet or set. Omit an empty notes block unless the template requires it.
- Use a label for an observed state or view direction. For an instruction, name the object and give a direct verb and an observable result or sourced limit. Keep consequential exclusions, timing and preconditions explicit. For example, where the connector specification sets the sequence, “Fit W2P after both pin contacts lock” tells the assembler when to fit the wedge. Write in the project language and preserve actual terminal markings.
- At the affected item, say what to check and when. If a heading helps locate the note, name the part or circuit. Use a formal hold-point label only when the project calls for one. Put rationale, source comparisons, purchasing history and step-by-step commissioning in the appropriate companion record. Carry across any acceptance limit or use restriction the reader needs on the detached sheet. Remove reminders such as “wire as shown” or “verify all work”. Retain mandated owner wording.
- For an assembly BOM, identify the assembly and quantity basis. Give item or device reference, description, manufacturer and part number or controlled stock code, quantity and unit. Add supplier when requested. Distinguish fitted quantity, kit contents, setup/spares and order packs. Cross-check each item and separately supplied accessory against the view or parent assembly. Use remarks only for exceptions that affect selection, fit or supply. Honour a requested word limit by keying longer instructions to the affected item.

## Mandatory release gates

For issue of a drawing or an explicit release review, record each applicable gate as PASS, FAIL, or UNVERIFIED with concise evidence tied to the exact output revision. Use N/A only with a reason. Missing evidence is not PASS; a checklist tick or generator assertion is not evidence. For a text proof or partial review, give the located findings, corrections and scope of what was checked. Save the gate record for drawing release.

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
