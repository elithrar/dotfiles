# Rendered self-review

Use this review for the changed surface once implementation is coherent. Inspect wide desktop and narrow phone widths and the affected controls, including keyboard behavior. For a full redesign, cover all controls; for a narrow change, expand the review only for a concrete regression risk. If rendering is unavailable, complete source-level checks and state the visual verification gap.

## 1. Thumbnail test

Zoom out or view a full-page thumbnail.

- Can you identify the dominant headline or image immediately?
- Is there one obvious reading path rather than several equal focal points?
- Do dense and quiet sections alternate?
- Does the page silhouette differ from a generic centered hero plus card grid?

If not, change scale, section proportions, or placement before adding detail.

## 2. Grid and alignment

- Do repeated edges share clear axes?
- Are spans, crops, overlaps, and offsets deliberate?
- Do rules, image edges, labels, and copy blocks reinforce the same structure?
- Are decorative grids subordinate to content?

Remove elements that cannot justify their placement.

## 3. Type

- Does display type create real contrast with body and telemetry?
- Are the largest lines tightly spaced without collisions or accidental clipping?
- Are paragraphs comfortably readable and limited to sensible line lengths?
- Is mono text limited to short technical roles?
- At 200% text zoom, can essential content still be read and controls still be used?

## 4. Color and imagery

- Is the signal color attached to state, action, or a single deliberate poster field?
- Are neutral fields doing most of the visual work?
- Does image grading support legibility without erasing the subject?
- Are overlays placed in quiet regions and kept sparse?
- Do annotations use supplied content or unmistakably neutral placeholders rather than invented subject data?

## 5. Responsive behavior

- At roughly 375px wide, is the main idea visible without sideways scrolling?
- Are interactive targets reachable and at least comfortably tappable?
- Did wide technical rails move, simplify, or disappear without losing essential meaning?
- Are headline breaks intentional rather than orphaned?
- Is reading order correct in both layout and source order?

## 6. Accessibility and interaction

- Navigate all controls by keyboard and confirm visible focus.
- Check landmark structure, heading order, alt text, labels, and reduced motion.
- Confirm that color is not the only signal for active, selected, warning, or progress states.
- Remove hover-only information needed to understand or operate the page.

## 7. Authenticity audit

Ask: would the page still feel neo-industrial if the grid and orange accent were removed?

The answer should be yes because typography, composition, density, and image treatment already establish the direction. If the answer is no, revise the underlying hierarchy. Do not compensate with more reticles or tiny labels.

## Completion threshold

Do not claim the work is complete while any of these remain:

- the primary hierarchy is unclear;
- body or functional text is illegible;
- interactive content clips or scrolls sideways on mobile;
- decorative instrumentation overwhelms the subject;
- default styling on the changed surface undermines the requested visual direction;
- the accent color has no consistent meaning;
- essential keyboard, focus, contrast, or reduced-motion behavior is missing.

Record the most important correction made during review. A useful correction names the observed failure and the concrete change, for example: “The telemetry rail competed with the title at phone width, so it now follows the hero image and loses two redundant labels.”
