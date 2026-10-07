# Art direction and generation

## Identity and choreography

Lock only the features needed to preserve the requested character: silhouette and proportions, face/eye construction, palette/materials, anatomical side of asymmetric accessories, grip/attachment, and the approved rendering style. Refer to the authoritative base image; a pose guide specifies movement/layout, not a competing character design. Check native and intended display sizes before multiplying a weak base into an atlas.

Assign each reference an explicit role: character identity, rendering style, prop construction, expression or layout. Borrowing another character's painterly style should not import its costume or anatomy. Freeze an accepted canonical base and important prop detail; if either changes materially, re-review dependent rows rather than treating the old approvals as current.

Write a compact frame plan tied to the available timing:
- **Sustained states:** maintain a readable pose with small continuous movement. Avoid rebuilding a full arm lift/drop or full blink every short cycle. Calm breathing should not inflate the whole body or change head scale.
- **Event actions:** plan anticipation, action, contact and recovery. If runtime cannot play once or pause, adapt the artwork for repetition rather than promising a control the format does not expose.
- **Locomotion:** distinguish walking, jogging and running through contact, compression, passing, flight, alternating support and arm-leg opposition. A slower-looking gait is not automatically a better calm animation. Account for uneven per-frame durations, especially a long final hold.
- **Work/tool actions:** define each hand's role and the full contact cycle. Keep grip, fulcrum/contact point, object support and tool trajectory intelligible. A tool merely moving nearby can fail to communicate useful work. Separate the work pose from waiting and inspection.
- **Grounded actions:** select the actual support points. A toe tap can keep the heel planted; a lean can move the head without moving the feet. Do not judge floor contact from a prop's lowest pixel.

These are design choices, not mandatory gestures. Preserve the user's chosen personality, intensity, props and style. A new prop is justified by the requested action, not by a generic state label.

For a problematic gait, track the same near/far anatomical leg through the whole cycle using hip attachment, depth/shading and overlap. Label each frame's support, toe-off, flight or landing. Two running-looking silhouettes can repeat the same lead leg and fail to produce an alternating gait. For tool repairs, allow the connected hands/forearms to follow a corrected grip; moving the prop alone can detach the action. Numerical targets in a prompt remain proposals until measured in the output.

## Directional families

Where a target needs pointer-facing poses, confirm its angle convention and ordering first. Establish clear cardinal anchors, then generate the intermediate families. Direction should agree across pupils, muzzle/chin and head pitch/yaw; moving pupils alone may be insufficient at small size.

Keep the lower body planted unless the target calls for whole-body turning. Review the complete cycle, including cross-row boundaries. Mirroring can suit a symmetric character, but an opposite-facing view must preserve the intended anatomical side of asymmetric equipment and markings. Far-side eye or accessory occlusion is legitimate; adding a near-side replacement can silently switch anatomical sides.

Use blind, unlabeled direction checks when ambiguity matters. Correct cardinals are necessary but do not prove evenly spaced or readable diagonals. Prefer a natural near-cardinal pose with a disclosed subtle axis over deforming the character solely to satisfy a simplistic metric.

## Generation and registration

Generate separated, complete poses with enough margin for deterministic extraction. Use one shared scale per coherent family; compare head/torso size and ground references across families. If an entire source family is uniformly too large, a documented whole-family scale correction may be appropriate. Do not resize each frame to the same opaque bounding box: that destroys real lean, stride width and jump height.

An extraction failure is not automatically a drawing failure. Inspect the extraction mode and rejected boundaries: missing/clipped art needs an artwork repair; complete poses that are grouped, spaced or cropped incorrectly may need extraction settings or whole-pose re-spacing. Do not regenerate sound artwork merely because a fallback slot crop cut into it.

Deterministic translation can remove accidental layout drift. Anchor to stable anatomy such as pelvis/torso and actual support points, not silhouette center, which changes with arms and props. Preserve intentional vertical displacement in airborne or bouncing phases. Inspect translated cells for clipping and changed contacts.

Choose transparency processing from the source actually produced. Native alpha does not require chroma despill. Chroma removal must preserve similarly colored character details. Inspect edges and interior gaps on contrasting backgrounds after cleanup; do not let global processing change already approved frames unnoticed.

## Change strategy when repetition is not helping

Repeated full-row prompts can keep reproducing the same gait, bad grip, profile drift or missing contact. After the same substantive defect recurs, compare attempts and identify the cause before another generation. Choose a different approach supported by the artwork tool, for example:

- Generate and approve key contact/extreme poses before in-betweens.
- Split a difficult row into smaller coherent phase groups sharing explicit boundary/reference poses.
- Repair one localized grip/contact/face problem while preserving the accepted surrounding construction.
- Simplify the action or silhouette when the frame budget or display size cannot carry it.
- Correct registration deterministically when the art is sound and placement is the actual defect.

Reassemble and test both internal joins and the final wrap. Smaller groups can introduce new style, scale or timing discontinuities; they are not automatically superior. Rotation, mirroring, warping or interpolation can be legitimate authored transforms when they suit the character, style and permitted toolchain. Verify the result's identity, anatomy, support and target contract; a transform cannot stand in for an unresolved pose or conceal a defect. If recovery needs a different deliverable, new authority, or substantial added cost, explain the concrete choice rather than continuing blindly.
