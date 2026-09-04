# Visual system

Use this reference when designing or implementing a web experience with the skill.

## Design grammar

Neo-industrial work combines two tensions:

- **Editorial mass:** oversized grotesk type, hard blocks, abrupt scale changes, asymmetric composition, cropping, and confident empty space.
- **Instrument precision:** monospaced metadata, hairline coordinates, grids, reticles, brackets, calibration marks, status color, and measured repetition.

The page should not look like a sci-fi HUD pasted onto a template. Start with editorial composition; use instrumentation to clarify the content and the underlying grid.

## Typography

### Roles

- **Display:** a neutral or slightly grotesque sans such as Arial/Helvetica/Geist/Inter/Neue Haas-like forms. Use 650–900 weight, tight tracking, and compact leading.
- **Body:** the same sans at a calmer weight. Main body should normally be at least 1rem with 1.25–1.45 line height.
- **Telemetry:** a condensed or compact mono. Use uppercase sparingly for labels, identifiers, units, timestamps, axes, and short states. Do not set long prose in mono.

### Scale and spacing

- Build display sizes with `clamp()` and viewport units. A principal title often lands between `clamp(4rem, 16vw, 15rem)` and may crop at a section edge.
- Use tighter tracking as type grows: roughly `-0.03em` to `-0.07em` for the largest lines; keep body tracking near normal.
- Keep display leading between `0.76` and `0.92` when glyphs permit. Check accents, wrapped lines, and descenders.
- Contrast macro and micro type. If the main title is enormous, supporting labels should be visibly small but still readable—generally 0.75rem or larger, with regular interface labels closer to 0.875rem.
- Use brackets, parentheses, slashes, dashes, registered marks, and indexes as compositional punctuation, not on every heading.

## Palette

Use a compact, high-contrast palette. A reliable starting system:

| Role | Suggested value | Use |
|---|---:|---|
| Carbon | `#111310` | dark fields, type on light surfaces |
| Bone | `#F2F0E7` | light fields, type on dark surfaces |
| Signal orange | `#FF4F00` | active states, rules, targets, primary actions |
| Machine gray | `#A6AAA3` | secondary notation and dividers |
| Sensor green | `#17231D` | optional image wash or dark secondary field |

- Keep neutrals dominant. Signal orange should usually occupy less than 15% of a typical viewport unless the whole section is intentionally a poster-like signal field.
- On an all-orange field, use black or carbon type and reduce other decoration.
- Do not add several unrelated accent colors. A cool cyan may appear only as a second data channel with a clear meaning.
- Meet practical contrast for all functional text and controls. De-emphasized metadata may be quieter but should remain readable.

## Layout

### Grid

- Use a 4-, 8-, or 12-column CSS grid with a visible or implied baseline. Define gutters as fluid tokens.
- Treat rules and image edges as layout anchors. Reuse a small set of x-positions across hero, sections, captions, and footer.
- Combine broad fields with narrow technical rails. Good patterns include `3/9`, `4/8`, `2/7/3`, and equal thirds for indexed modules.
- Avoid centering every section. Prefer flush-left alignment, opposing edges, vertical labels, and deliberate offsets.

### Density

- A dense section can contain image, telemetry, and annotations, but it still needs one dominant reading path.
- A quiet section can be mostly type or negative space. Do not fill every empty region.
- Let some elements overlap, span columns, or break a boundary only when the reading order remains obvious.

### Surfaces

- Use hard section boundaries: color inversions, 1px rules, or image transitions.
- Prefer zero to small radii (`0–4px`). Reserve larger rounding for a subject that explicitly calls for it.
- Avoid generic card mosaics. Group information with alignment, rules, numbering, or background fields first.

## Images

- Choose one strong image before a gallery of weak ones. Full-bleed, edge-cropped, or split-field placements fit the system.
- Favor documentary, industrial, aerial, thermal, technical, or product-detail imagery with real texture.
- Apply a restrained grade: high contrast, desaturation, a cold green/blue cast, monochrome, or blown-out thermal color. Preserve meaningful subject detail.
- Add annotations in HTML/CSS so they stay sharp and responsive. Use simple lines, reticles, boxes, percentages, coordinates, and short labels.
- Keep overlays sparse and aligned. One target box and three purposeful labels are stronger than a screen full of readouts.
- Use supplied labels and values. When no annotation content is provided, omit it or use an unmistakably neutral placeholder rather than inventing subject data.

## Graphic language

Use a small motif set repeatedly:

- thin grid lines and baseline rules;
- square registration points;
- corner brackets and target frames;
- rulers, ticks, indexes, and coordinates;
- solid rectangular signal blocks;
- halftone, scanline, or dot fields at low opacity;
- oversized numerals, parentheses, and technical identifiers;
- vertical or rotated labels on wide screens.

Prefer CSS gradients and borders for non-representational grids and calibration marks. Use trusted icons for functional controls. Do not build representational artwork from CSS shapes.

## Interaction and states

- Focus states should use a high-contrast outline or bracket, not a soft glow.
- Hover may invert a block, reveal an orange rule, or shift a label by a few pixels.
- Active states should reuse the signal color and an additional non-color cue.
- Keep transitions fast: approximately 120–240ms for controls and 300–600ms for deliberate section reveals.
- For reduced motion, remove sweeps and transforms while preserving state changes.

## Common failure modes

- **Template in costume:** rounded cards and centered hero remain underneath a dark palette and mono labels. Rebuild the silhouette and grid.
- **HUD cosplay:** arbitrary data-like decoration crowds the subject. Delete most overlays and keep only notation that supports structure or state.
- **Everything shouts:** every heading is huge and every rule is orange. Establish one primary moment and quieter supporting sections.
- **Tiny-type theater:** critical information is reduced to illegible telemetry. Promote important content to body size.
- **Accidental chaos:** offsets and overlaps do not share alignment anchors. Return elements to the grid, then break it once with intent.
- **Desktop poster on mobile:** the composition only shrinks. Recompose columns, reorder secondary rails, and set new mobile line breaks.
