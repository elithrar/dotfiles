---
name: anti-slop
description: Detect and remove AI writing tells ("slop") from prose while preserving the author's voice. Load when drafting or reviewing prose, blog posts, essays, white papers, marketing copy, emails, docs, or reports, and when a human asks to make writing sound less AI-generated or to review someone else's writing for AI tells. Triggers on "sounds like AI", "slop", "AI tell", "make this more human", "editorial pass", or "review my writing".
---

## Anti-Slop: Writing and Reviewing Human-Sounding Prose

"Slop" is phrasing that signals machine authorship and erodes a reader's trust: filler that announces itself, hedged puffery, formulaic rhythm, and clever-sounding constructions that carry no information. The goal is not to strip personality. It is to remove the patterns that make a reader think "a model wrote this" so the ideas land.

## Prime directive: preserve voice

The most common failure of an anti-slop pass is over-correction into flat, voiceless text. That is its own tell. Before deleting anything, decide whether it is *slop* (adds no meaning, follows a formula) or *voice* (a deliberate choice the author would defend).

- Cut filler, formula, and hedging.
- Keep rhythm the author earns: a short punchy fragment after a long sentence, a deliberate tricolon, a load-bearing contrast, a strong closing line.
- When unsure, leave it. A false positive that flattens a good sentence is worse than one surviving tell.

Make surgical edits. Do not restructure paragraphs, reorder arguments, or change meaning unless asked. Change phrasing, not substance.

## Workflow

### When reviewing (yours or someone else's)

1. Read the whole piece first. Note voice: is it punchy, formal, conversational? You are matching this, not overwriting it. 2. Scan for the tells in the catalog below. Collect *candidates* — do not edit yet. 3. Validate each candidate: does removing it lose meaning? Is it formula or voice? Discard false positives. 4. Apply the surviving edits one at a time, each a minimal phrasing change. 5. Re-read the edited passages for rhythm. Fix anything that now reads choppy or flat. 6. Report what changed and the tell category for each, so the author can judge.

### When drafting

Write first, then run the review workflow on your own draft before delivering. Do not self-censor into blandness while drafting; catch tells on the edit pass.

## The tell catalog

| Tell | Why it erodes trust | Fix |
| --- | --- | --- |
| Meta throat-clearing — announcing the point before making it: "It is worth noting that…", "There is a failure mode worth naming…", "Here is the tension." | Wastes the reader's time; signals padding. | Delete the frame. State the thing. |
| Demonstrative kicker — a vague "This/That + verdict" fragment tacked after a sentence: "That instinct backfires.", "This is where the risk hides.", "That is the whole point." | Formulaic filler rhythm; the "verdict" usually restates the prior sentence. | Cut it, or fold the idea into the sentence; pivot the next sentence with a real transition ("But…"). |
| Puffery adverbs — genuinely, truly, actually, simply, deeply, structurally, fundamentally. | Intensifiers that add heat, not light. | Delete. If the claim needs the adverb to be true, the claim is weak. |
| Importance-flagging — "Speed is not a footnote here.", "This matters.", "Make no mistake." | Tells the reader what to feel instead of earning it. | Show the consequence directly. |
| Clever metaphor flourish — "an authorization bug wearing the costume of a performance optimization." | Reads as a model performing wit. | State it plainly: "an authorization bug, not a performance optimization." |
| Grandiose prediction — "will define the next decade", "changes everything", "the future of X". | Overclaiming; lowers credibility in serious writing. | Cut or scope to a concrete, defensible claim. |
| Rule-of-three reflex — every list padded to three parallel items. | Predictable cadence; the third item is often filler. | Vary list length. Keep two if two is true. |
| Antithesis overuse — "not X, but Y" as a tic in paragraph after paragraph. | One is rhetoric; five is a template. | Keep the load-bearing one; rewrite the rest as plain statements. |
| Correlative bloat — "not only… but also", "whether… or". | Scaffolding that inflates simple sentences. | Split or simplify. |
| Hedged confidence — "It's important to consider…", "One might argue…", "In many ways…". | Sounds authoritative while committing to nothing. | Take the position or cut the sentence. |
| Section-closing summary — a final sentence that restates what the paragraph just said. | Redundant; a model habit. | Delete if it adds nothing. |
| Overused lexicon — delve, tapestry, realm, landscape, underscore, leverage, seamless, robust, crucial, pivotal, testament, navigate (figurative), foster, elevate, unlock. | Statistically flagged AI vocabulary. | Swap for plain words or cut. See references/tells.md. |

## Concrete before / after

Meta throat-clearing

- Before: "There is a failure mode worth naming directly, because well-intentioned teams walk straight into it. It is the belief that safety means a human approving every step."
- After: "Many teams equate safety with a human approving every step."

Demonstrative kicker

- Before: "…reuse the machinery we already have. That instinct is where most of the risk hides. Four properties break the assumptions."
- After: "…reuse the machinery we already have. But four properties break the assumptions."

Importance-flagging + staccato

- Before: "Speed is not a footnote here. It changes which controls are viable. Anything that depends on a person noticing has already lost."
- After: "Speed changes which controls are viable: anything that depends on a person noticing has already lost."

Clever flourish

- Before: "an authorization bug wearing the costume of a performance optimization"
- After: "an authorization bug, not a performance optimization"

## What to keep (do not "fix" these)

These are voice, not slop. Deleting them is the over-correction failure.

- Earned fragments: "Not flagged after the fact. Removed." — a short beat after a long sentence, used sparingly, for emphasis.
- Deliberate parallelism: "You can have either. You cannot have both."
- A strong closing line: "The perimeter fell twelve years ago. The session is next."
- First-person conviction: "We think…", "We are not comfortable saying…" when the author owns a real position.

The test: could the author defend this choice if asked? If yes, keep it. Slop cannot be defended — it is there because a pattern put it there.

## Guardrails

- Never change facts, numbers, names, citations, or technical claims during a phrasing pass.
- Never restructure or re-argue. Phrasing only, unless explicitly asked for more.
- Validate every candidate before editing; report false positives you chose to keep and why.
- Do not introduce new slop while removing old (e.g. replacing a kicker with a different formulaic kicker).
- One tell fixed cleanly beats three fixed clumsily. Stop when the remaining candidates are voice, not slop.

## Review checklist

```

- [ ] Read whole piece; noted the author's voice
- [ ] Collected tell candidates without editing
- [ ] Validated each: slop vs voice; discarded false positives
- [ ] Applied surviving edits as minimal phrasing changes
- [ ] Re-read for rhythm; fixed new choppiness/flatness
- [ ] Facts, numbers, structure untouched
- [ ] Reported changes + tell category per edit

```
