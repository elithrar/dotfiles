---
name: add-skill
description: Create or improve agent skills. Load when creating SKILL.md files, writing skill descriptions, or structuring skill content for OpenCode or Claude.
---

# Creating Agent Skills

Skills extend agent capabilities with domain-specific knowledge. Use skills for procedural knowledge the agent lacks—not for concepts it already understands.

If guidance is project-specific or one-off, use INSTRUCTIONS.md or inline context instead.

Skill work is prompt engineering plus evaluation. Treat every skill as a behavioral artifact: define when it should trigger, what better behavior it should cause, how to verify that behavior, and how to avoid overfitting one example.

## Creation Workflow

1. Capture intent: target behavior, trigger phrases, non-trigger near misses, expected output, dependencies, and safety constraints.
2. Research current docs or similar skills when the domain is fast-moving or tool-specific.
3. Draft the smallest SKILL.md that changes behavior; put bulky reference material in `references/` and deterministic repeated work in `scripts/`.
4. Create representative eval prompts before claiming the skill is done.
5. Run or simulate baseline vs. with-skill behavior where practical; revise based on observed failures, not taste.
6. Add trigger evals for should-trigger and should-not-trigger cases when description quality matters.

## Structure

### Required Frontmatter

Every SKILL.md must start with YAML frontmatter on line 1:

```yaml
---
name: my-skill-name
description: What this skill does and when to use it. Third-person.
---
```

**Field requirements:**
- `name`: lowercase, hyphens only, max 64 chars, no reserved words ("anthropic", "claude")
- `description`: max 1024 chars, specific triggers + capabilities

### File Organization

```text
skill-name/
├── SKILL.md      # Required. Target under 200 lines.
├── references/   # Optional detailed content, one level deep.
├── scripts/      # Optional deterministic helpers.
└── evals/        # Optional behavior/trigger tests.
```

Use `references/` when SKILL.md exceeds 200 lines. Add scripts when multiple evals would make the agent recreate the same helper.

## Writing Descriptions

The description determines when the skill activates. Include both **what it does** and **when to use it**.

**Always use third-person** (the description is injected into the system prompt):

| Quality | Example |
|---------|---------|
| Good | `Manages GitLab MRs and pipelines via glab CLI. Load before running glab commands.` |
| Good | `Analyzes web performance with Chrome DevTools MCP. Use when auditing page load or Lighthouse scores.` |
| Bad | `I help you with GitLab operations.` |
| Bad | `Useful for various tasks.` |

Include key terms users might mention: tool names, file extensions, specific operations. Make descriptions slightly assertive when under-triggering would be costly: “Load before…” or “Use when…” is better than “Helpful for…”.

Also write near-miss boundaries when skills overlap: “Use X for security PR audits; use Y for normal code review.”

## Content Guidelines

### Match Specificity to Task Fragility

**High freedom** (multiple valid approaches):
```markdown
Review code for potential bugs, readability, and adherence to project conventions.
```

**Medium freedom** (preferred pattern with variation):
```markdown
Use pdfplumber for text extraction. For scanned PDFs requiring OCR, use pdf2image instead.
```

**Low freedom** (fragile operations):
```markdown
Run exactly: `python scripts/migrate.py --verify --backup`
Do not modify flags.
```

### Writing Style

- **Imperative form**: "Use X" not "You should use X"
- **Assume competence**: Skip explanations of concepts the agent knows
- **One term, consistent**: Pick "endpoint" or "route", not both
- **No time-sensitive content**: Avoid "as of 2025" or "after next release"

### Quick Reference Tables

For CLIs and APIs, provide lookup tables:

```markdown
| Task | Command |
|------|---------|
| Check status | `glab ci status` |
| View logs | `glab ci trace <job>` |
| Retry job | `glab ci retry <job>` |
```

## Common Patterns

### Prerequisite Verification

Check requirements before proceeding:

```markdown
## FIRST: Verify Installation

Run this before any commands. If it fails, STOP—this skill doesn't apply.

\`\`\`bash
glab --version
\`\`\`
```

### Workflow Checklists

For multi-step tasks, provide a copyable checklist:

```markdown
## Workflow

Copy this checklist to track progress:

\`\`\`
- [ ] Step 1: Analyze input
- [ ] Step 2: Validate mapping
- [ ] Step 3: Apply changes
- [ ] Step 4: Verify output
\`\`\`
```

### Evals

For each new or materially changed skill, add 2-5 realistic behavior evals when practical:

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": "realistic-case",
      "prompt": "Real user-style task prompt",
      "expected_output": "Observable behavior that should improve with the skill",
      "files": [],
      "assertions": []
    }
  ]
}
```

For trigger tuning, create 16-20 realistic prompts split between `should_trigger: true` and tricky near misses with `should_trigger: false`. Prefer prompts that look like real user requests, not abstract labels.

When iterating, generalize from eval failures. Do not add brittle instructions that only fix one fixture.

### Concrete Examples

Show input/output pairs instead of abstract descriptions:

```markdown
**Input**: Added user authentication with JWT tokens
**Output**:
\`\`\`
feat(auth): implement JWT-based authentication
\`\`\`
```

## Anti-patterns

- **Verbose explanations**: Don't explain what PDFs are or how libraries work
- **Multiple options without defaults**: Recommend one approach, mention alternatives briefly
- **Vague descriptions**: "Helps with documents" won't activate correctly
- **Deeply nested references**: SKILL.md → file.md → another.md breaks navigation
- **Magic constants**: Document why values were chosen, or let the agent decide
- **No evals for fragile behavior**: Without representative prompts, description and workflow changes are guesswork
- **Overfitting examples**: Do not encode a test prompt’s incidental details as universal rules

## Checklist

Before finalizing a skill:

- [ ] Frontmatter starts on line 1 with `---`
- [ ] `name` is lowercase with hyphens only
- [ ] `description` includes triggers and capabilities (third-person)
- [ ] SKILL.md is under 200 lines (use `references/` if larger)
- [ ] References are one level deep from SKILL.md
- [ ] Quick reference table for any CLI/API commands
- [ ] Prerequisite verification if skill depends on tools/config
- [ ] No time-sensitive information
- [ ] Evals added for fragile behavior or trigger accuracy
- [ ] Tested with representative tasks
