# 3D-printing handoff

## Choose the requested stage

Distinguish geometry for a print service, a configured slicer project, and an inspected slice. Establish the additive process and material only as needed for the next design decision. Printer/nozzle details may be controlled by a service; do not demand them for an honest geometry-only delivery.

For functional parts, account for orientation-dependent strength, fit, wall/feature realization, assembly, and postprocessing. Use source-backed process limits rather than universal clearances, support angles, or boss ratios. Select thread/insert/fastener geometry and installation method for the actual material and hardware; a modeled helix alone does not prove usable threads.

## Validate geometry and representation

Verify explicit scale and units, transforms, orientation, intended components, bounds, and critical features against the authoritative source. STL lacks a dependable unit declaration; communicate intended units and verify the target import size. Check appropriate mesh topology: manifoldness/watertightness, self-intersections, degenerate triangles, orientation, disconnected shells, and intended unions or separations.

Inspect tessellation error at curves, small features, and mating surfaces. A dense mesh can still be wrong; a smooth render can hide coarse geometry. Preserve functional openings, clearances, wall/floor thickness, and feature coverage. Do not silently repair, fuse, hollow, or rescale accepted geometry.

A generic 3MF can contain geometry without a usable application-specific machine/material/process setup. Do not call it a configured project from its extension. Reopen it in the target application and verify the effective settings, including inherited overrides and object-level settings.

## Verify the slice when requested

Use the actual target application/version and correct machine, nozzle where relevant, material, process, orientation, and placement. Slice the delivered project and inspect layer/toolpath previews for missing thin features, unintended filled holes, disconnected islands, unsupported starts, support contact/removal, trapped material, and intended separation between parts.

Assess process-specific escape, drainage, washing, curing, powder/support removal, and surface access where applicable. Avoid inaccessible support or sealed cavities that defeat postprocessing. Verify shrink/fit compensation is deliberate and applied only once. Estimated time/material are slicer estimates, not measured results.

If the target slicer/profile is unavailable, deliver checked geometry with that gate unverified rather than inventing settings or claiming print readiness. A passed slice still requires appropriate physical fit/strength/finish proof for its intended use. Do not start a print or control the machine without separate authorization.

## Primary anchors

Check current relevant documentation when needed: [3MF core specification](https://github.com/3MFConsortium/spec_core/blob/master/3MF%20Core%20Specification.md), [Bambu Studio](https://github.com/bambulab/BambuStudio), and [Prusa modeling guidance](https://help.prusa3d.com/article/modeling-with-3d-printing-in-mind_164135). Use the selected printer/material producer's requirements for actual production values.
