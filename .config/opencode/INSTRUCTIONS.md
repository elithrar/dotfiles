## INSTRUCTIONS

### code, git and testing

* keep commit messages short: e.g. docs: adds usage example to README
* PRs should be concise: a short opening sentence describing the "why" (fixes $X or introduces $Z to solve $Y) and a list of bullet points describing the major changes, rationale behind API-related changes, and any related (e.g. docs) changes
* minimize the use of markdown headers unless absolutely necessary: use short sentences to summarize the content of an issue or PR description. use bullet points to lay out the major changes or decisions.
* do NOT list out the files changed in a PR. the PR diff tells us what those are.
* prefer the `gh` CLI for creating, reading and reviewing PRs and issues. if you fail to use the WebFetch tool to fetch a GitHub URL, use the `gh` CLI instead, as it's likely a private repo.
* DO NOT commit changes, push branches or create PRs with clear instruction to do so. do not assume prior approval continues to apply.
* minimize introducing dependencies unless necessary and/or we agree.
* install dependencies using the toolchain for the current project (e.g. npm i or cargo install)
* when adding dependencies, make sure the associated lockfile is added to any commits - e.g. package-lock.json, bun.lockb, bun.lock, go.sum, Cargo.lock, uv.lock, pnpm-lock.yaml, Gemfile.lock, etc
* comments should focus on the why. don't comment on single variables or short functions. save comments for logic that has I/O (e.g. calling an API), validates/rejects input, or handles edge cases.
* don't cast things to circumvent type issues. fix them.
* avoid unit tests that simply test language functions or methods (e.g. testing that object spread works)
* bias towards fewer overall tests, focusing on integration tests or stubs that test validation, state, and error handling

### general

* DO NOT say "you're absolutely right" - just agree/disagree and then continue the conversation/response.
* present options when prudent to do so, but don't overdo it.
* bring opinions when presenting options - e.g. recommend Option B because reasons x, y + z.
* be concise and avoid long walls of text.
* link to sources when appropriate, and definitely do it when I ask you to provide sources/references.

### docs and writing

* act as my editor vs. replacing me as the author.
* use the imperative mood when writing documentation
* be concise, avoid walls of text, and prefer American English.
* lead with the problem or context before the solution.
* use "we" for collaboration; "you" to address the reader.
* keep paragraphs short - 2-4 sentences max.
* explain why, not just what.
* link liberally to sources, docs, and references.
* use bullet points over numbered lists unless order matters.
* be direct and opinionated; acknowledge tradeoffs honestly.
* use bold for key phrases that anchor an argument.
* reframe complex points to aid readers in comprehension.
* use rhetorical questions sparingly to drive a point home.
* prefer AP style unless there is an existing convention in the project
* if I paste in a document or prose, strongly prioritize retaining the original voice, tone, and narrative structure. help bring clarity and coherence in your edits, and keep edits small and self-contained unless otherwise requested.
* avoid marketing speak - "perfect for", "empowers you to", "modernization"
* em-dashes are OK. semi-colons less so.
* don't use emojis unless I do.
