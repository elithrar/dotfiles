# Skill review follow-up — 2026-10-08

The starting point is `e007b24808a46b506b270a29303dbc642e390e6d` (PR #116).
This record covers the targeted follow-up changes in the accompanying PR.
`cut-ready`, installed personal skills, and historical WoW eval records are unchanged.

## Finding disposition

| Skill | Disposition |
| --- | --- |
| animated-sprites | No instruction defect found. Deferred optional atlas/timing fixtures to its next behavioral update; no art or motion behavior changes here. Preserve both acceptance gates and protected-cell checks. |
| anti-slop | Narrowed the editorial-review trigger to filler/formulaic prose. Added positive, factual-README near-miss, and deliberate-parallelism scenarios. Deferred the optional contents list for the short, already organized tell catalog. |
| code-reviewer | Named `origin/main` explicitly in the base-ref assertion. Added a disposable Git fixture with stale local main, diverged remote main, and a feature upstream that would yield an empty diff. |
| create-readme | No material defect found. Kept the valid description and conditional examples; deferred optional shortening and a new suite because no routing failure was measured. |
| logging-sucks | Supplied concrete missing-log, credential-disclosure, and clean sampling implementations. Replaced generic expected findings with observable, scoped assertions that preserve the logger and field schema. |
| motronic | Made the absent-ROM case explicit and testable without inventing calibration bytes. Added no-start assertions and contents links to the three long references. Existing technical text, offsets, hashes, and safety boundaries are unchanged. |
| neo-industrial-design | Qualified both handoff instructions for unchanged passes, unavailable rendering, and review-only work. Added three focused handoff scenarios. Kept the visual grammar and completion gates; deferred the optional visual-system contents list. |
| prompt-engineer | Supplied the over-searching prompt and required untested labeling unless observed results establish improvement. Deferred optional description compression; retained the model/reference routing and other scenarios. |
| summarize-work | Conditioned global retrieval on advertised support. Added normalized history with a local-midnight boundary, one-message fix with diff/test evidence, and unimplemented proposal. Made the current-context commit case a no-server near miss. |
| web-perf | Replaced the unspecified live-site case with labeled synthetic evidence and a runnable late-banner page. Added source-only and missing-MCP assertions; no field CWV, INP, or measured-savings claims from synthetic inputs. |
| wow-addon-development | No instruction defect found. Kept historical evidence intact; a new model/client run remains appropriate for a future behavior-affecting change, not a claim made by this PR. |

## Executed validation

- Parsed all 11 in-scope skill frontmatter blocks, five OpenAI metadata sidecars,
  and ten skill-local JSON files (eight scenario files plus two JSON fixtures).
  Checked names, description limits, duplicate keys, optional metadata types,
  and 34 case definitions. All six referenced fixture files resolve.
- Checked 66 local Markdown file/anchor links. All resolve. Compared the three
  Motronic references after removing their new contents blocks: the pre-existing
  technical text is unchanged. Confirmed no `cut-ready` changes and clean diff whitespace.
- Generated the Git fixture in a temporary directory. Verified the correct merge
  base, stale local main, feature upstream, and exclusion of the later main-only
  file. Node execution confirmed the base handles null and the feature throws.
- Executed the logger fixture with rejected/successful payment stubs and a
  recording logger. Reproduced the missing event and synthetic credential leak;
  checked correlation, response status, success sampling at 0.09 versus 0.10,
  error retention, and the seven-field clean output.
- Parsed the history fixture with timezone-aware Python. The 07:15 UTC fix falls
  on October 8 in America/Los_Angeles; the 06:59 UTC message does not. The one-message
  fix and proposal are retained, and the advertised paths omit a global endpoint.
- Rendered the banner fixture with Playwright and Chromium at 800×800. The main
  content moved from y=0 to y=120 after the delayed banner; observed layout-shift
  entries summed to 0.141. An in-memory comparison reserving 120px from the start
  kept y=120 and yielded zero shift. The deliberately failing source fixture was
  preserved. These observations are separate from the JSON fixture's synthetic values.

Runtimes: Python 3.12.14, Node 24.19.0, Chromium 151.0.7922.173. No dependencies
were installed. Checks ran in disposable or execution-workspace locations; no
production endpoint, live OpenCode server, vehicle, or WoW client was exercised.

## Review and evidence limits

Re-read the complete changed instructions, eval definitions, and added fixtures
against every finding above. No remaining change-introduced defect was identified
by that static review. This was a single-reviewer assessment, not an independent
model review or an automated activation benchmark.

The anti-slop, design handoff, missing-ROM, and prompt-engineering cases received
prose/contract review only. Fixture execution does not prove model behavior.
The normalized history check does not test live OpenCode endpoint compatibility.
Some unchanged older scenarios still need a supplied repository or prompt before
they can run; this PR does not claim the entire collection is an executable suite.
`skills-ref` was not installed or run. The format checks allow optional specification
fields and are not a replacement for product-side validation.

The review used the [Agent Skills specification](https://agentskills.io/specification),
[OpenAI skill guidance](https://learn.chatgpt.com/docs/build-skills),
[Astra guidance](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra),
and [Anthropic skill guidance](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices).
Description compression, contents lists, and extra evals are optional refinements,
not format requirements. Domain-specific validation and authorization boundaries
remain functional requirements of the individual skills.
