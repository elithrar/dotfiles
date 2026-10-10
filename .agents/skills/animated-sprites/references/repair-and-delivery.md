# Repair, evidence and delivery

## Turn feedback into bounded revisions

Keep a compact approval/change record tied to exact artifact versions:
- What the user approved and what must remain unchanged.
- Each criticized state/frame/transition and the intended perceptual correction.
- Which families will change, the comparison evidence needed, and any unresolved constraint.

Do not infer a global preference from one action. “Softer idle” does not mean “slower run.” “This is great” on selected rows is a reason to preserve them, not permission to redesign the whole sheet.

For unchanged approved cells, store decoded RGBA hashes and their cell mapping before edits. Compare the same pixels in the final encoded output after all shared assembly, normalization, resampling and cleanup, even for rows untouched by targeted generation. An encoded whole-file hash changes when any row changes; use per-cell decoded hashes to prove approved cells stayed identical. If shared processing unexpectedly changes protected cells, restore their original decoded pixels and recheck the final output. If a requested global transformation must alter approved pixels, identify that scope change rather than silently weakening the check.

Review rows individually with frame/transition evidence, then inspect the whole sheet for shared causes such as scale, facial construction, lighting, registration or pacing. Apply a proven root-cause fix to all affected rows, but do not blanket-regenerate passed rows. If a global correction must change protected artwork, make that scope explicit and obtain any needed approval.

For each revision, name the correction hypothesis and inspect whether it worked. When it did not, retain the evidence and change strategy as described in the generation reference. Avoid repeated “fixed” claims based solely on a successful tool call or a new-looking still.

## Keep traceable evidence

Use a small manifest or existing project records; no particular serialization is required. Retain enough to connect:

- Authoritative reference art and the user's applicable feedback/approval.
- Source family versions, generation/edit prompts and selected/rejected attempts that explain important decisions.
- Extraction, scale and registration choices, including intentional motion kept intact.
- Final filename/version/hash, current target contract, duration vectors and preview derivation.
- Structural output, visual review scope, tested transitions, protected-cell checks, remaining warnings and untested runtime behavior.

Use a stable, descriptive versioned filename such as `character-name-spritesheet-vN.png` for review/source copies, with the extension matching the actual encoding. Increment the version for changed deliverable bytes and retain the prior version for comparison. Preserve any filename/path required by the target runtime; record its mapping to the versioned copy and hash. Do not confuse the filename with the target asset ID or create a duplicate asset merely to version a file.

Keep only useful provenance. Do not duplicate private chat history or unrelated user information into a portable skill or public deliverable. A saved reviewer report is evidence of that review's claims; it is not an independent rerun. If a source snapshot or validation record is missing, say which claim cannot be reproduced.

## Final checks and presentation

Validate the exact final bytes after the last transformation. Re-extract and inspect repaired rows, their transitions, and protected cells. Resolve structural errors and meaningful perceptual failures; preserve honest warnings when the user accepts a bounded limitation.

Provide media that fits the request:
- A labeled repeated diagnostic or matched comparison for motion review.
- A clean single-state clip when the user wants a focused demonstration.
- A directional contact sheet plus a clearly illustrative sweep when spatial gaze poses need explanation.
- A source/QA archive when reproducibility or continued editing is part of the deliverable.

Use backgrounds, labels and type appropriate to the user's requested presentation; a particular project's dark-green background or monospace labels are not universal defaults. Keep captions outside the sprite and preserve the verified timing. Before sending, open the exported media, inspect representative frames and seams, and verify duration/order. State whether playback itself was observed or only decoded frames and metadata were reviewed.

## Apply through the target lifecycle

Use the current product adapter for upload, update, selection and readback. Update the resolved existing asset rather than creating a duplicate; preserve selection unless activation was requested. Review approval and permission to apply are separate when the user has only asked for analysis or previews.

After application, verify returned identity and requested metadata/state. If stored bytes can be read, compare their hash with the validated upload. If download/readback fails, report upload acceptance and metadata verification accurately; do not claim stored-byte equivalence. A successful update still does not establish live animation quality until the actual runtime is inspected.
