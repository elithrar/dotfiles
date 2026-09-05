# Vendor handoff and SendCutSend

Use when a named vendor's process requirements affect geometry, export, or a manufacturing handoff. Vendor requirements change; check the current official rules relevant to the task. A local color-only edit does not require refreshing unrelated material data or uploading the file again.

## SendCutSend routing snapshot

The following was verified against SendCutSend's official guidance on 2026-08-13. Treat it as a routing aid, not a substitute for a current check.

- Getting started and accepted formats: <https://sendcutsend.com/guidelines/getting-started/>
- General guidelines: <https://sendcutsend.com/guidelines/>
- Sheet cutting and STEP/STP requirements: <https://sendcutsend.com/guidelines/sheet-cutting/>
- CNC machining requirements: <https://sendcutsend.com/guidelines/cnc-machining/>
- Bending setup: <https://sendcutsend.com/faq/how-do-i-set-up-my-part-for-bending/>
- Bend configuration for STEP: <https://sendcutsend.com/faq/how-to-configure-bends-for-my-step-file/>

Current stable workflow expectations include:

- Use 2D DXF, DWG, AI, or EPS, or 3D STEP/STP as supported for the selected service.
- Build at 1:1 scale and include only the intended part, cut paths, and bends.
- For normal sheet or plate STEP uploads, provide one solid sheet-metal body, align a stationary entity flat to a plane, use uniform stock thickness, avoid meshes, and use through-features for full-depth cutting.
- For bent STEP parts, model the formed flanges with current material-specific bend definitions, then verify each bend angle and direction after upload.
- For 2D cut files, remove open contours, duplicate lines, stray points, empty objects, live text, and unmerged shapes. Follow the current layer and service-line rules.

## Print-and-cut routing

Sticker and decal vendors use different cutline names, spot colors, bleed, safe areas, color modes, raster resolutions, and proof workflows. Retrieve the exact product and vendor requirements instead of normalizing them into one rule.

Useful official examples, verified on 2026-08-13:

- Roland VersaWorks requires designated `CutContour` or `PerfCutContour` spot-color paths for supported print-and-cut data: <https://downloadcenter.rolanddg.com/contents/manuals/VW6_English/ffk1725848718165.html>
- StickerApp currently specifies a closed vector die-cut path plus product-specific bleed and safe margins: <https://stickerapp.com/support/artwork-design/templates-guidelines/how-to-make-your-own-cutlines>
- Sticker Mule publishes different cutline, border, bleed, and color guidance and provides an online proof: <https://www.stickermule.com/support/faq/artwork/what-are-your-artwork-requirements-for-stickers-and-labels>

Treat these as vendor examples, not interchangeable specifications.

Do not copy minimum holes, webs, size limits, tolerances, bend radii, K factors, or eligible material thicknesses from this skill. Retrieve the current values for the exact process, material, thickness, and finishing services.

## Preview and quote review

An upload is a validation step, not authorization to order. After uploading, check:

1. Displayed units and overall size against the manufacturing packet.
2. Part count, contour or feature count, holes, slots, and internal cutouts.
3. Selected process, material, exact stock thickness, quantity, and finish.
4. Bend detection, angle, direction, stationary face, and flange orientation.
5. Added services such as tapping, countersinking, hardware, deburring, or finishing.
6. Warnings, auto-repairs, missing geometry, unexpected billet classification, or price anomalies that may signal a file problem.
7. A saved screenshot or written record of the preview and configuration.

For printed graphics, also check finished cut shape, die-cut versus kiss-cut behavior, bleed, safe area, white or transparent regions, border generation, color profile handling, laminate or finish, and which lines are proof-only versus production operations.

If the vendor preview differs from the production render or source dimensions, stop and diagnose the export or vendor interpretation. Do not "fix" the preview by arbitrary scaling.

## Physical proof gate

Before irreversible or costly production, require the appropriate human proof:

- Tape a 1:1 paper or cardboard profile to the actual mounting surface.
- Test-cut inexpensive material for fit, registration, weeding, and assembly.
- Check a printed or vendor proof for exact size, crop or cut contour, bleed, color, borders, and unchanged proportions.
- For formed parts, verify bend directions and interference against the assembly.

Do not place an order, approve a vendor proof, or purchase material without explicit user authorization.
