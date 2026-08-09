# Vendor handoff and SendCutSend

Use this reference whenever a named vendor will manufacture the result. Vendor requirements change. Browse the vendor's current official guidance and material catalog before finalizing geometry.

## SendCutSend routing snapshot

The following was verified against SendCutSend's official guidance on 2026-08-04. Treat it as a routing aid, not a substitute for a current check.

- Getting started and accepted formats: <https://sendcutsend.com/guidelines/getting-started/>
- General guidelines: <https://sendcutsend.com/guidelines/>
- STEP/STP sheet and plate requirements: <https://sendcutsend.com/guidelines/3d-files>
- CNC machining requirements: <https://sendcutsend.com/guidelines/cnc-machining/>
- Bending setup: <https://sendcutsend.com/faq/how-do-i-set-up-my-part-for-bending/>
- Bend configuration for STEP: <https://sendcutsend.com/faq/how-to-configure-bends-for-my-step-file/>

Current stable workflow expectations include:

- Use 2D DXF, DWG, AI, or EPS, or 3D STEP/STP as supported for the selected service.
- Build at 1:1 scale and include only the intended part, cut paths, and bends.
- For normal sheet or plate STEP uploads, provide one solid sheet-metal body, align a stationary entity flat to a plane, use uniform stock thickness, avoid meshes, and use through-features for full-depth cutting.
- For bent STEP parts, model the formed flanges with current material-specific bend definitions, then verify each bend angle and direction after upload.
- For 2D cut files, remove open contours, duplicate lines, stray points, empty objects, live text, and unmerged shapes. Follow the current layer and service-line rules.

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

If the vendor preview differs from the production render or source dimensions, stop and diagnose the export or vendor interpretation. Do not "fix" the preview by arbitrary scaling.

## Physical proof gate

Before irreversible or costly production, require the appropriate human proof:

- Tape a 1:1 paper or cardboard profile to the actual mounting surface.
- Test-cut inexpensive material for fit, registration, weeding, and assembly.
- Check a printed or vendor proof for exact size, crop or cut contour, bleed, color, borders, and unchanged proportions.
- For formed parts, verify bend directions and interference against the assembly.

Do not place an order, approve a vendor proof, or purchase material without explicit user authorization.
