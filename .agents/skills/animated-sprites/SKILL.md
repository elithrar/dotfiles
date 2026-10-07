---
name: animated-sprites
description: Create, repair, and review custom characters for 2D animation, animated sprite sheets, and custom Codex or ChatGPT pets, with consistent identity, readable motion, and timing-faithful previews.
---

# Animated Sprites

Treat character identity, animation behavior, and the target's technical contract as separate requirements. A valid atlas can still contain a distracting or unreadable animation.

## Establish the target

- Resolve the actual reference art, existing asset, requested change, and delivery destination. Review-only requests do not authorize regeneration or application; supplied local bytes can be reviewed without a remote fetch or mutation.
- Read the target's current format/runtime contract: required states and their meanings, frame order/counts, canvas and cell geometry, anchors, transparency, timing, repeat/trigger behavior, and available controls. Do not infer a schema from a previous pet. For custom Codex/ChatGPT pets, use the available product-specific creation/update skill and current sprite contract for formatting, validation and lifecycle operations; this skill supplements their art and motion decisions.
- Distinguish technical state identifiers from user-visible meanings. A state called `running` can mean active work rather than foot-running.
- Record approved artwork and protected frames before revising. Preserve existing asset identity and activation state unless the user requests otherwise.

## Build or revise

For character design, new choreography, directional poses, or repeated generation failures, read [Art direction and generation](references/art-direction-and-generation.md).

Define the identity lock and a short frame plan before generating: what communicates each state, what moves, what stays anchored, and how the motion returns. Generate coherent pose families using the approved character reference. Register with a shared scale; never independently fit every pose into its cell. Intentional jump lift and gait bounce must survive assembly.

Use the required image-generation/editing tool for artwork changes. Deterministic crop, translation, assembly and alpha processing are production operations, not substitutes for drawing a missing pose or faking anatomy. Apply cleanup only when the source needs it.

## Use two separate acceptance gates

1. **Structural gate:** validate the exact encoded output against the current target contract, including required/unused cells, boundaries, alpha and file constraints. Inspect automated flags; legitimate gaps between limbs or a tool and body can trigger false positives.
2. **Perceptual motion gate:** assess character consistency, anatomy, attachment, state meaning, motion amplitude, cadence, support/contact, every loop seam and relevant state transition at actual timing and display scale. Neither a structural pass nor an attractive contact sheet substitutes for this gate.

Read [Motion review and preview harness](references/motion-review.md) when reviewing or delivering animation. Keep before/after timing and presentation equivalent. Never slow the preview to conceal a runtime pacing defect. Label illustrative gaze sweeps separately from observed pointer behavior.

## Close the iteration

For feedback-driven repairs, approved-cell protection, evidence records, or final delivery, read [Repair, evidence and delivery](references/repair-and-delivery.md).

Translate criticism into a specific correction hypothesis and preserve accepted rows. If repeated full-row generations fail for the same reason, change the representation or staging rather than adding more prohibitions to the same prompt. Recheck repairs in the final assembled output, including neighboring frames and protected cells.

Report measured facts, visual judgments, and untested behavior separately. Disclose remaining gaps. Show the requested previews and apply the result only within the user's authorization; successful upload is not proof of stored-byte identity or live-runtime behavior.
