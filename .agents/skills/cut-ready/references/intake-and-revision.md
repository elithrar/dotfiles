# Intake, evidence, and revision control

Use this reference before generating geometry and before every revision.

## Minimum manufacturing packet

Record only facts that affect the result:

| Job | Required inputs |
|---|---|
| 2D profile or graphic | Process, material, thickness when relevant, units, finished dimensions, inside and outside cut intent, quantity, handed variants, target vendor |
| Formed sheet part | Material, exact stock thickness, units, formed dimensions, bend angles and directions, grain or cosmetic face when relevant, target vendor |
| Machined STEP part | Material, units, critical dimensions and tolerances, inaccessible or sharp internal features, threads or finishing services, target vendor |
| Reference-derived replica | Source images, at least one defensible scale anchor, intended physical surface, perspective limits, target size or fit check |

Ask one question when a missing value changes the geometry. Otherwise proceed with a clearly recorded assumption that is safe and reversible.

## Evidence ledger

Classify every controlling dimension or shape:

- **Measured:** Taken from the actual part, vehicle, mounting points, scan, or calibrated drawing.
- **Specified:** Supplied by the user or a current primary manufacturer or vendor source.
- **Derived:** Calculated from measured or specified inputs. Show the calculation.
- **Reconstructed:** Estimated from photographs or secondary sources. Record the scale anchor, perspective assumptions, range, and confidence.
- **Stylistic:** Chosen for appearance rather than fit or manufacturing necessity.

Do not write false precision. Prefer `nominal 550 mm, estimated ±20 mm` over `551 mm` when photographs support only the former. Distinguish the physical surface that controls fit from a larger shell, envelope, or bounding box.

For reconstruction-derived work, prepare a 1:1 paper, cardboard, or inexpensive-material proof against the actual surface before production.

## Revision contract

Write this short contract before editing:

```markdown
Baseline: <file or revision>
Editable: <only the requested elements>
Frozen: <accepted geometry, colors, text, dimensions, layers, orientation>
Invariants: <bounds, centers, stroke or feature thickness, canonical assets>
Checks: <how the requested delta and non-delta will be proven>
```

Apply these rules:

- Preserve accepted elements directly. Do not redraw them from memory.
- Reuse canonical components such as glyph alphabets, logos, hole patterns, bend rules, and generator functions.
- Define percentage changes with an explicit anchor and axis. "10% larger" is incomplete without the center, fixed edge, or reference frame.
- For a color-only revision, change only the declared color values and prove geometry is unchanged.
- For a localized geometry revision, compare unchanged component counts, bounds, and hashes where byte stability is expected. Use overlays or geometry diffs when serialization can change.
- Keep the previous revision available. Do not overwrite it unless asked.
- Regenerate previews and validation reports from the production export, not from an earlier source view.

## Visual review

Render at useful scales and inspect:

- Overall proportions and intended physical fit.
- Negative space, visual fill, alignment, and optical balance.
- Small features at actual production size, not only enlarged on screen.
- Mirrored or reverse-cut variants, including readable orientation after application.
- Requested changes against the baseline and unintended changes outside scope.

When source rights or reproduction restrictions matter, preserve the user's permitted-use boundary in the package and do not broaden it.
