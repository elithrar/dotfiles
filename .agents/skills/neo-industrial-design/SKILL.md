---
name: neo-industrial-design
description: "Design or restyle web interfaces with a neo-industrial and editorial-brutalist visual system: oversized grotesk typography, strict grids, high-contrast neutral fields, signal accents, technical notation, hard image crops, and instrument-like interaction. Use when the user requests this visual direction for a site, landing page, portfolio, product page, or interface. Do not use for copywriting, subject research, generic dark themes, or ordinary dashboards without this visual brief."
---

# Neo-Industrial Design

Apply a coherent visual system to web content. The result should feel engineered, editorial, and physically composed: typography carries the hierarchy, a disciplined grid controls tension, imagery behaves as evidence, and technical graphics clarify structure or state.

The user's instructions and existing product requirements take precedence. Treat supplied copy, facts, information architecture, and imagery as content inputs. Do not research, fact-check, or rewrite substantive content unless the user explicitly asks. When required content is missing, use neutral placeholders or leave the region open rather than inventing subject matter.

## Set the visual thesis

Choose the following before implementation:

1. **Mode:** editorial, instrumental, or hybrid. Editorial mode is type-led and poster-like. Instrumental mode is image- or interface-led. Hybrid mode alternates them.
2. **Dominant gesture:** one primary move, such as an edge-cropped title, a full-bleed image under a grid, a bracketed word, or a giant index.
3. **Grid:** columns, outer gutter, and recurring alignment axes. Deliberate violations should remain accountable to those axes.
4. **Signal:** one accent color with a consistent visual role such as action, selection, position, or emphasis.

Read [references/visual-system.md](references/visual-system.md) before designing or restyling the interface. Use it as a system of relationships, not as a checklist of effects.

## Build from macro to micro

1. Establish section proportions, dominant fields, reading order, and the type/image silhouette.
2. Lock the display, body, and annotation type roles and their scale contrast.
3. Apply the grid to content edges, rules, images, navigation, and repeated modules.
4. Introduce only the graphic motifs that reinforce an alignment, boundary, state, measurement, or interaction.
5. Add responsive compositions and interaction states without weakening the desktop hierarchy.

Preserve semantic HTML, source-order clarity, keyboard access, visible focus, alt text, useful contrast, and readable body sizes. Technical styling does not justify inaccessible text or controls.

## Make responsiveness compositional

- Recompose wide grids into fewer columns instead of shrinking the desktop canvas uniformly.
- Set intentional mobile headline breaks and preserve the primary reading path.
- Move secondary rails after main content; remove only redundant decoration.
- Prevent interactive content from clipping or causing horizontal scrolling.
- Retain deliberate display-type cropping only when the title remains understandable and fully available to assistive technology.

## Review the rendered result

Before presenting or publishing, perform [references/review.md](references/review.md) against the rendered page at wide desktop and narrow phone widths. Fix failures in hierarchy, alignment, legibility, responsiveness, or interaction. Do not add motifs to compensate for a weak composition.

## Output

Deliver a usable, responsive web interface with one legible visual thesis and a consistent design system. In the handoff, state the chosen mode and the most important visual correction made during rendered review.
