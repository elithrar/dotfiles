# Motion review and preview harness

## Review the final representation

Extract review frames from the actual encoded atlas or animation that will be delivered. Keep its content hash with the review. Source strips, pre-cleanup renders and old previews cannot prove that the final assembly is correct.

For new-sheet or full-sheet acceptance, inspect every required frame. A focused repair/review can cover the changed rows, adjoining transitions and protected-cell checks; name unreviewed areas instead of implying exhaustive acceptance. Review at native and intended display sizes, enlarging suspicious anatomy/alpha details. If actual display size is unknown, call the reduced-size check a proxy. Include light and dark backgrounds where edge quality matters.

Keep four claims independent: structural validity, perceptual animation quality, published-byte identity, and observed runtime cadence/trigger frequency. Evidence for one does not establish the others. A preview can reproduce frame timing while still differing from how often the app triggers or repeats an action.

Separate:
- **Measured:** dimensions, populated cells, alpha bounds, durations, order, baseline offsets, content hashes and unchanged protected pixels.
- **Visual:** silhouette/face consistency, lawful occlusion, natural weight transfer, readable action, distracting repetition and visible snaps.
- **Untested:** live triggers, pointer smoothing, blending, cooldowns, device scaling or other behavior not actually observed.

Pixel-difference or alpha-hole metrics nominate inspection areas. They do not establish an anatomical defect, perceptual smoothness or correct gaze by themselves.

## Independent review when it adds evidence

For a new complete sheet, comprehensive review, or repeated substantive failures, obtain an independent, non-leading review when a reviewer is available. Give the reviewer the exact final media, authoritative character references, intended task and runtime constraints. Withhold earlier verdicts and the desired outcome; for blind state/direction checks, also withhold expected labels. Scale the review to the changed work and risk rather than requiring a fixed reviewer count or exhaustive review for every edit.

Ask for specific state/frame/transition evidence, the visible consequence, and an actionable correction or explicitly bounded warning. Reconcile disagreements by returning to the artifacts and timing; vote counts do not establish correctness. After a correction, rerun the affected finding and neighboring transitions, verify protected rows, and record whether the issue is resolved or remains an accepted limitation against the new artifact version. Do not close a finding merely because the prompt changed or a validator passed.

## Real-duration repeat harness

Record the timing source: verified renderer code/observations or an authoritative runtime contract can establish runtime timing; a bundled preview helper establishes only its authored preview timing unless parity is verified. Label the harness accordingly. Preserve the chosen duration vector, including unequal holds. A PNG alone does not supply timing.

Reducing movement can make a fixed-duration loop feel quieter without lengthening its period. If the user requires a genuinely slower or longer cycle, verify whether the renderer can change durations or schedule holds. When it cannot, explain that limitation and distinguish the available art-only improvement from the requested timing change.

For sustained states, watch enough uninterrupted repetitions to reveal recurrence and wrap behavior; about 10–15 seconds is a useful starting point for short loops. Extend when a longer cycle needs it. Show event actions under their intended trigger behavior when known, and separately label any forced-repeat stress test. Do not claim forced repetition is observed app behavior.

A diagnostic view should make frame/state identification possible without covering the character. Before/after comparisons should use identical scale, background, timing, phase and loop count. Avoid zoom changes, interpolation, easing, crossfades or altered playback rate that can conceal the defect. A slower inspection view may be additional, explicitly labeled evidence, never the acceptance view.

Verify exported timestamps/durations, frame order and total cycle time, including quantization introduced by a fixed-fps export. Nominal video fps can be misleading for variable-frame-rate files. Check decoded output for duplicate/skipped frames, truncation and last-frame holds. If actual-speed motion cannot be inspected, report the completed structural/pose/timing checks and keep perceptual motion acceptance pending until playback inspection or explicit user acceptance of the preview. Do not promote sequential-frame review into a motion pass.

## Transition coverage

Record the exact tested frame pairs or sequences, not merely “transitions checked.” Cover:

1. Every adjacent pair within each changed action or direction sequence.
2. Last→first of every loop, including directional-cycle closure and boundaries between separately generated groups/rows.
3. Entry into each changed action and return to its expected resting state. For a jump, review the complete rest→anticipation→airborne→contact→recovery→rest sequence.
4. Relevant edges of the target's state-transition graph, if available. For continuous states that can be interrupted at arbitrary phase, sample likely worst-case exits as well as normal loop boundaries.
5. Changed frames next to preserved frames, including any stitch introduced by a localized repair.

Follow the same anatomical extremity through these joins, not only each pose's label. For a gait, track hip, knee and ankle/boot ownership and travel; a folded rear foot jumping directly to a forward knee can skip the passing path despite individually valid contact/flight poses. Reallocate the existing frame budget to the missing transition. For a tool action, follow the connected hand/arm/tool trajectory through apex, stroke, contact and return rather than repeating similar low poses around an abrupt reset. Distinguish perceived disappearance from measured cell-edge truncation or ordinary occlusion before choosing a repair.

Compare displacement of the same anatomical landmarks against the per-frame durations, including half-cycle joins and the final wrap. Track supporting feet and recovery paths as well as pose silhouettes: individually plausible poses can hide an abrupt change in distance traveled per unit time. Judge changes relative to character/display scale, action phase and intended acceleration; do not impose universal pixel thresholds or assume uniform speed. Use these measurements to target actual-timing playback review, not to replace it.

Do not invent renderer interpolation to make hard state switches appear smooth. If the transition graph, entry phase or runtime blending is unknown, test the plausible transitions supported by the task and state the uncertainty. Do not assert exhaustive runtime transition coverage.

## Perceptual acceptance questions

- Does staging expose the primary action, with clear silhouettes and secondary motion that supports rather than competes with it?
- Do anticipation, action and recovery read as one intention, with coherent arcs, spacing and volume through the in-betweens?
- Does the state remain recognizable without its label? Similar quiet states may need a blind classification check at display size.
- Do calm states remain alive without repeated attention-seeking resets, excessive blinking or full-body puffing?
- Does the gait show alternating support and purposeful weight transfer? Are genuine flight phases preserved when a run is intended?
- Do contact, grip and attached accessories remain physically coherent? Is a crossing tool simply in front of a boot, or does the anatomy actually break?
- Do jump contact and recovery finish before the resting state resumes?
- Are eyes, anatomical accessory side, facial proportions and hand/foot silhouettes consistent through lawful occlusion?
- Do gaze sectors progress in order with readable cardinals, broadly even changes and stable body scale?

Classify remaining issues by consequence. A subtle near-cardinal axis or tiny painterly contour variation can be a disclosed limitation; a wrong cardinal, broken grip, lost limb, false state meaning or conspicuous loop reset needs correction. A structural pass does not lower this standard.
