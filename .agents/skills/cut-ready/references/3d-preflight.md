# Solid CAD, formed parts, and CNC

## Validate the actual solid

Use explicit units and 1:1 scale. Preserve intentional part/body relationships and only the geometry needed for the selected service. A surface-only or mesh model must not be passed off as a valid B-rep solid.

Independently import STEP or the requested solid format. Verify parse/schema, units, transforms, bounds, expected bodies/solids, closure, positive volume, and critical feature dimensions and locations. Diagnose healing and tolerance warnings. Render imported views/sections that expose bores, pockets, floors, joins, relief, and orientation.

Verify expected features before checking those present. For each changed or fit-critical feature, measure shape, size, location, depth, coverage, and termination at adjacent features. A named chamfer or plausible silhouette does not prove it exists. Inspect the full required extent and transitions to neighboring surfaces, using sections that expose incomplete or occluded geometry. Allow legitimate kernel face splitting and stated tessellation error; isolated matching vertices or bounds do not prove a continuous surface.

Distinguish functional lead-ins, stress-relief radii, specified cosmetic bands, and deburring. Preserve required sharp edges and mating surfaces. A shading bevel is not manufactured geometry; add no unrequested fillets or compensation.

## Formed sheet and plate

Verify exact stock thickness and uniform sheet geometry where required. Reconcile folded shape, flat pattern, bend order/direction, stationary/cosmetic faces, and grain orientation. Check holes, slots, and relief near bend zones in both states.

Use the producer's current material/thickness-specific bend definitions, relief, flange, and deformation limits. Do not invent a K factor or substitute generic values. Confirm whether the selected service accepts formed STEP, flat patterns, or service-line data. Full-depth sheet cutting does not imply support for pockets, countersinks, or partial-depth features; request them only through a supported process.

## CNC feasibility and feature representation

Match the actual route: milling, turning, or another specified process. Check tool approach/reach, pocket and slot depth/width, bore access, internal corner radii, undercuts, thin/unsupported features, stock, and plausible setup/fixture access. Do not judge a turned part solely by a three-axis milling checklist. Propose changes to inaccessible features without silently modifying accepted geometry.

Keep functional thread/fastener requirements separate from producer-specific representation. A producer may require simple holes plus service configuration, modeled threads, or another representation. Verify the current rule for internal/external threads and the exact operation; do not impose a universal pilot/major diameter. Check usable engagement, runout/drill space, wall/floor, bottom-out, and hardware installation access against actual requirements.

Identify fit-critical dimensions and finishing requirements in a channel the producer accepts; a neutral solid alone may not communicate tolerance, tapping, edge treatment, or finish. Confirm standard capability versus special inspection. Review available producer DFM findings and resolve unexplained inaccessible-material or thin-feature warnings.

Limit this route to CAD and producer handoff. A valid solid and plausible DFM assessment are not simulated CAM or machine-ready NC code; NC-program qualification and machine execution are outside scope.
