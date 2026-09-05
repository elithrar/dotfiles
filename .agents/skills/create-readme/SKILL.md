---
name: create-readme
description: Write or improve concise, reader-focused README.md files for open source projects. Use for new READMEs, README rewrites, installation and usage examples, or README reviews. Do not use for API references, tutorials, changelogs, contributing guides, or unrelated prose editing.
---

# Create README

Write a README that tells prospective users what the project does, why it is useful, and how to reach a working result.

## Workflow

1. Inspect the existing README, manifests, public APIs, examples, tests, release metadata, and license as relevant.
2. Identify the intended reader, the problem the project solves, its shortest useful workflow, and any adoption-critical limits or tradeoffs.
3. Choose only the sections the project needs. A typical order is: project name, direct introduction, key capabilities, installation, a minimal example, advanced workflows or design notes, contributing, and license.
4. Write the smallest realistic example first. Use actual commands, package names, APIs, and configuration from the repository. Add specialized examples only when they answer a likely next question.
5. Verify changeable claims, commands, links, supported versions, and examples. Run the smallest safe example or relevant check when feasible, and report anything that remains unverified.

## House Style

Use the house-style principles below. Consult these examples only when a requested style match needs more context: [elithrar/ask-bonk](https://github.com/elithrar/ask-bonk), [elithrar/simple-scrypt](https://github.com/elithrar/simple-scrypt), [elithrar/fuse-on-r2](https://github.com/elithrar/fuse-on-r2), and especially [gorilla/csrf](https://github.com/gorilla/csrf).

- Explain usefulness before setup. Name concrete outcomes and use cases instead of calling the project powerful, robust, or easy.
- Move quickly from context to installation and a working example.
- Introduce examples with what they demonstrate. Progress from the common case to meaningful variants.
- Put security warnings, operational caveats, and tradeoffs beside the example or claim they qualify.
- Use design notes when they help readers trust an important implementation choice.
- Keep the structure proportional to the project. A demo may need only context, tradeoffs, deployment, and links. A mature library may need compatibility, several examples, and design rationale.
- Use concise, direct American English with a conversational technical tone. Keep mild personality when it is natural.
- Preserve the author's terminology and voice. Avoid marketing language, filler, repetition, and sections added only by convention.

Never invent features, commands, support, performance, or maturity. If the project's purpose or audience cannot be established from available evidence, ask one focused question.

For an audit-only request, report prioritized findings without editing. For a create, rewrite, or fix request, update the README and preserve unrelated files.
