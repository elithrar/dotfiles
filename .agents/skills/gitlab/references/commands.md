# glab Command Reference

Detailed command options and examples. For quick reference tables and key workflows, see the main [SKILL.md](../SKILL.md).

## Merge Request Operations

### Create a Merge Request

```bash
# Non-interactive (preferred — avoids interactive prompts)
glab mr create --fill --yes -b main

# With explicit title and description
glab mr create \
  --title "fix: resolve auth timeout on mobile" \
  --description "$(cat <<'EOF'
Fixes session expiry handling for mobile clients.

- increase token refresh window from 5m to 15m
- add retry logic for failed refresh attempts
- add integration test for token lifecycle

Closes #42
EOF
)" \
  -b main \
  --assignee @me \
  --label "bug,auth"

# Draft, linked to issue
glab mr create --fill --yes --draft -b main
glab mr create --fill --yes --related-issue 42 -b main
```

### List Merge Requests

```bash
# List open MRs (default)
glab mr list

# Filter by state
glab mr list --merged
glab mr list --closed
glab mr list --all

# Filter by people
glab mr list --author @me
glab mr list --assignee @me
glab mr list --reviewer @me

# Filter by label or search
glab mr list --label bug,urgent
glab mr list --search "refactor auth"
glab mr list --draft
glab mr list --not-draft

# Limit results
glab mr list --per-page 10
```

### View and Inspect

```bash
glab mr view 123                 # view details
glab mr view 123 --comments     # include discussion
glab mr view 123 --web          # open in browser
glab mr diff 123                # view diff
glab mr checkout 123            # check out locally
```

### Update a Merge Request

```bash
glab mr update 123 --title "new title"
glab mr update 123 --label "reviewed,approved"
glab mr update 123 --assignee user1,user2
glab mr update 123 --reviewer user1,user2
glab mr update 123 --ready                      # remove draft status
glab mr update 123 --draft                       # mark as draft
glab mr update 123 --remove-source-branch        # toggle source branch removal
```

### Merge

```bash
glab mr merge 123                                # merge (auto-merge enabled by default)
glab mr merge 123 --auto-merge=false             # merge immediately, skip pipeline wait
glab mr merge 123 --squash                       # squash commits
glab mr merge 123 --squash --remove-source-branch
glab mr merge 123 --rebase                       # rebase before merge
```

### Review

```bash
glab mr approve 123
glab mr note 123 -m "Addressed feedback in latest commit"
```

## CI/CD Operations

### Pipeline Status

```bash
glab ci status                  # current branch pipeline status
glab ci status --live           # watch in real time
glab ci status --compact        # compact output
glab ci status --branch=main    # specific branch
glab ci list                    # list recent pipelines
glab ci view --web              # open in browser
```

Pipeline states: `pending`, `running`, `success`, `failed`, `canceled`, `skipped`

### Job Logs

```bash
glab ci trace <job-name>                        # stream logs for job
glab ci trace <job-id>                          # by job ID
glab ci trace <job-name> --branch main          # specific branch
glab ci trace <job-name> --pipeline-id 12345    # specific pipeline
```

### Retry and Rerun

```bash
glab ci retry <job-name>                        # retry a specific job
glab ci retry <job-name> --pipeline-id 12345    # retry in specific pipeline
glab ci run                                     # trigger new pipeline
glab ci run --branch main                       # trigger on specific branch
glab ci run --variables "KEY:value"             # with CI variables
```

### Artifacts

```bash
glab job artifact <ref> <job-name>              # download artifacts
glab job artifact main build --path="./out/"    # download to specific path
```

### CI Variables

```bash
glab variable list                              # list project variables
glab variable get SECRET_KEY                    # get specific variable
glab variable set KEY "value"                   # set a variable
glab ci run --variables "CI_DEBUG_TRACE:true"   # run with debug tracing
```

## Issues, Releases, Repos

Commands follow predictable patterns (`glab <resource> <action> [flags]`). Non-obvious syntax only:

```bash
# Clone with specific branch (note the -- separator)
glab repo clone <owner>/<repo> -- --branch <branch>

# Release with asset links
glab release create v1.0.0 --name "v1.0.0" --notes "$(cat CHANGELOG.md)" \
  --assets-links '[{"name":"binary","url":"https://..."}]'
```

## Search and API

Use `--search` on `glab issue list` and `glab mr list` for project-scoped search. For cross-project search, use the API:

```bash
glab api "search?scope=issues&search=login+error" | jq '.[] | {id, title, web_url}'
glab api "search?scope=merge_requests&search=auth+refactor" | jq '.[] | {id, title, web_url}'
glab api "search?scope=blobs&search=deprecated+function" | jq '.[] | {path, project_id, ref}'
```

`glab api` supports `--method POST`, `--field key=value`, and `--paginate` for any GitLab REST endpoint.

## Troubleshooting

| Problem | Diagnosis | Fix |
|---------|-----------|-----|
| 401/403 errors | `glab auth status` | `glab auth login` |
| Wrong GitLab instance | Check `glab config get host` | `glab auth login --hostname gitlab.example.com` |
| MR targets wrong branch | Check project default branch | Pass `-b <branch>` explicitly |
| Pipeline not triggered | Branch may not have CI config | Check `.gitlab-ci.yml` exists on branch |
