# Skill evaluation inputs

Skill-local scenarios live in `../skills/<skill>/evals/evals.json`. Resolve each
`files` entry relative to that JSON file's directory. Copy listed inputs into an
isolated trial directory before an edit-capable run; never edit the source
fixtures as the task output. Follow a case's `setup` when it needs generated
repository state. Give the agent the prompt, input files, skill access, and
runtime constraints; keep `assertions` and `expected_output` for grading.

The scenarios are evaluation inputs, not recorded passes or an automatic runner.
Some older cases still describe required context rather than bundling it. Supply
that context before execution or record the case as not run. Do not treat a
missing artifact as permission to invent its contents.

The performance evidence is explicitly synthetic, not a captured browser trace.
The summary history is normalized test data, not an OpenCode wire-format schema.
Fixture execution can verify a Git graph, logger output, or rendered shift; it
does not establish that a model selects or follows the skill correctly.

For a behavioral run, record the skill commit, model/runtime, supplied inputs,
observed output, assertion results, and remaining verification gaps. Keep such
records outside installable skills, as in `wow-addon-development/` here. Preserve
historical records when adding a new run.
