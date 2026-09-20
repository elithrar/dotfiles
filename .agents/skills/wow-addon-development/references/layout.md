# Layout and scaling

## Coordinate and geometry model

Distinguish physical pixels, UIParent units, and a frame's local coordinates. Track parent and effective scale, and convert at explicit boundaries. Follow the user's UI scale unless separate add-on scaling is requested. Use the matching client's [PixelUtil implementation](https://github.com/Gethe/wow-ui-source/blob/live/Interface/AddOns/Blizzard_SharedXML/PixelUtil.lua) when pixel alignment matters; do not substitute a remembered conversion formula.

Share one normalized geometry model between preview, live rendering, hit regions, and movers. Resolve profile overrides before computing dimensions. Include insets, spacing, borders, and rounding consistently; apply pixel snapping once. Invalidate geometry caches when scale, content, style, or dimensions change.

Read usable dimensions before clearing valid anchors. Hidden or newly constructed regions can have unresolved geometry. Preserve the last valid placement and retry through an appropriate layout notification rather than collapsing to zero or polling indefinitely. Keep measurement and application distinct, guard reentrant layout, and bound settling work when width changes text wrapping and height.

## Responsive content

Derive minimum dimensions from the sidebar, insets, scrollbars, labels, and usable controls. If the viewport cannot accommodate those dimensions, adapt the arrangement or provide scrolling. Clamping position cannot fix an oversized window.

Resize and restyle existing controls. Do not reconstruct a page tree because its width changed. Coalesce resize updates where useful and always apply the final layout at drag completion. Provide a real resize interaction when requested, using the target client's supported bounds and sizing APIs.

Synchronize a scroll child's width with its viewport and compute height from actual content. Initialize geometry on construction as well as resize. A bare ScrollFrame clips content but supplies no user navigation; provide a scrollbar, wheel, or keyboard interaction and clamp its offset to the current range.

Measure wrapped/localized text rather than estimating height from byte counts. Give truncated content an accessible full-text view. Multiline editors need caret visibility in both directions; check the target template's cursor-coordinate contract and recompute scroll range when wrapping changes.

## Placement and recovery

Store independent placement records for independently movable frames. Choose whether scaling preserves screen position, an anchor relationship, or logical offsets, then use that convention for both saving and restoring. Validate anchor names and finite coordinates; choose deliberate defaults before clamping.

Refit size and position after restoration, resizing, scale changes, and display changes. Keep the drag handle reachable and provide a reset-position path. Apply the same fitting rules regardless of the order of resize and scale operations, and keep persisted dimensions consistent with the applied result.

Check small/large viewports, fractional scales, scaled parents, long content, first open, reopen, and off-screen saved positions. Verify resolved control bounds and reachability; use a real client for rendering and physical input behavior.
