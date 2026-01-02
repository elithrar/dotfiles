---
name: gitlab
description: Helps with complex GitLab workflows using the glab CLI. Use when a git remote contains "gitlab" in the URL. Handles cloning repos, creating and updating merge requests, fetching and addressing review comments, searching across GitLab projects/issues/MRs, and coordinating changes across multiple repositories.
---

# GitLab Workflow

Work with GitLab repositories, merge requests, issues, and CI/CD pipelines using the `glab` CLI. This skill applies when the git remote URL contains "gitlab".

## Prerequisites

This skill requires the `glab` CLI. If `glab` commands fail with "command not found", ask the user to install it:

```bash
# macOS
brew install glab

# Linux (Debian/Ubuntu)
sudo apt install glab

# Other methods: https://gitlab.com/gitlab-org/cli#installation
```

Authentication must be configured. Run `glab auth status` to check. If not authenticated:

```bash
glab auth login
```

## Detecting GitLab Remotes

Before using `glab`, verify you're working with a GitLab repository:

```bash
git remote -v | grep -i gitlab
```

If the output contains "gitlab.com" or a self-managed GitLab instance, proceed with `glab` commands. Otherwise, this skill does not apply.

## Workflow

Copy this checklist to track progress:

```
GitLab Workflow:
- [ ] Phase 1: Repository setup (clone/verify remote)
- [ ] Phase 2: Branch and changes
- [ ] Phase 3: Merge request creation/update
- [ ] Phase 4: Review and iteration
- [ ] Phase 5: CI/CD monitoring
```

### Phase 1: Repository Setup

#### Clone a Repository

```bash
# Clone via glab (uses authenticated user context)
glab repo clone <owner>/<repo>

# Clone with specific branch
glab repo clone <owner>/<repo> -- --branch <branch>

# Clone to specific directory
glab repo clone <owner>/<repo> <directory>
```

#### Fork a Repository

```bash
# Fork to your namespace
glab repo fork <owner>/<repo>

# Fork and clone immediately
glab repo fork <owner>/<repo> --clone
```

#### View Repository Info

```bash
glab repo view
glab repo view <owner>/<repo>
```

### Phase 2: Branch and Changes

#### Create a Branch

```bash
git checkout -b feature/my-feature
# Make changes, stage, and commit
git add .
git commit -m "feat: add new feature"
```

#### Push Branch

```bash
git push -u origin feature/my-feature
```

### Phase 3: Merge Request Operations

#### Create a Merge Request

```bash
# Interactive creation
glab mr create

# With specific options
glab mr create \
  --title "feat: add new feature" \
  --description "$(cat <<'EOF'
## Summary
Brief description of changes

## Changes
- Change 1
- Change 2

## Testing
How to test these changes
EOF
)" \
  --target-branch main \
  --assignee @me \
  --label "enhancement"

# Create as draft
glab mr create --draft --title "WIP: feature in progress"

# Create and auto-fill from commits
glab mr create --fill
```

#### List Merge Requests

```bash
# List open MRs
glab mr list

# List MRs by state
glab mr list --state merged
glab mr list --state closed
glab mr list --state all

# Filter by author or assignee
glab mr list --author @me
glab mr list --assignee @me

# Filter by label
glab mr list --label bug,urgent
```

#### View Merge Request Details

```bash
# View current branch's MR
glab mr view

# View specific MR
glab mr view 123

# View in browser
glab mr view 123 --web
```

#### Update a Merge Request

```bash
# Update title
glab mr update 123 --title "new title"

# Add labels
glab mr update 123 --label "reviewed,approved"

# Change assignees
glab mr update 123 --assignee user1,user2

# Mark ready for review (remove draft)
glab mr update 123 --ready

# Add reviewers
glab mr update 123 --reviewer user1,user2
```

#### Merge a Merge Request

```bash
# Merge when pipeline succeeds
glab mr merge 123

# Merge immediately (skip pipeline check)
glab mr merge 123 --when-pipeline-succeeds=false

# Squash and merge
glab mr merge 123 --squash

# Delete source branch after merge
glab mr merge 123 --remove-source-branch
```

### Phase 4: Review and Iteration

#### Fetch Review Comments

```bash
# List all notes/comments on an MR
glab mr note list 123

# View MR diff
glab mr diff 123
```

#### Address Review Comments

1. Read the comments:
   ```bash
   glab mr note list 123
   ```

2. Make requested changes locally

3. Commit and push:
   ```bash
   git add .
   git commit -m "fix: address review feedback"
   git push
   ```

4. Reply to comments (via web or API):
   ```bash
   # Add a note to the MR
   glab mr note create 123 --message "Addressed feedback in latest commit"
   ```

#### Approve a Merge Request

```bash
glab mr approve 123
```

#### Check Out an MR Locally

```bash
# Check out MR branch locally for testing
glab mr checkout 123
```

### Phase 5: CI/CD Monitoring

#### View Pipeline Status

```bash
# View pipelines for current branch
glab ci status

# List all pipelines
glab ci list

# View specific pipeline
glab ci view <pipeline-id>
```

#### View Job Logs

```bash
# List jobs in pipeline
glab ci list --pipeline <pipeline-id>

# View job trace/logs
glab ci trace <job-id>
```

#### Retry Failed Pipeline

```bash
glab ci retry <pipeline-id>
```

#### Run a New Pipeline

```bash
# Trigger pipeline on current branch
glab ci run

# Trigger with variables
glab ci run --variables "KEY=value"
```

## Searching GitLab

### Search Issues

```bash
# Search in current project
glab issue list --search "bug in login"

# Search by label
glab issue list --label "bug"

# Search across all accessible projects (use API)
glab api "search?scope=issues&search=login+error" | jq '.[] | {id, title, web_url}'
```

### Search Merge Requests

```bash
# Search in current project
glab mr list --search "refactor auth"

# Search across GitLab (use API)
glab api "search?scope=merge_requests&search=auth+refactor" | jq '.[] | {id, title, web_url}'
```

### Search Code/Projects

```bash
# Search for projects
glab api "search?scope=projects&search=my-library" | jq '.[] | {id, name, web_url}'

# Search code (blobs)
glab api "search?scope=blobs&search=deprecated+function" | jq '.[] | {path, project_id, ref}'
```

## Multi-Repository Operations

For coordinated changes across multiple repositories (e.g., dependency updates, security fixes):

### Strategy

1. **List affected repositories**: Identify all repos that need changes
2. **Clone each repository**: Use `glab repo clone`
3. **Create branches with consistent naming**: Use a common prefix (e.g., `fix/security-CVE-2024-XXXX`)
4. **Make changes in each repo**: Apply the fix/update
5. **Create MRs with linked descriptions**: Reference the tracking issue

### Example: Coordinated Security Fix

```bash
# Define repos and fix details
REPOS="group/repo1 group/repo2 group/repo3"
BRANCH="fix/CVE-2024-12345"
ISSUE_URL="https://gitlab.com/group/tracker/-/issues/100"

for repo in $REPOS; do
  echo "Processing $repo..."
  
  # Clone if not exists
  if [ ! -d "$(basename $repo)" ]; then
    glab repo clone "$repo"
  fi
  
  cd "$(basename $repo)"
  
  # Create branch and make changes
  git checkout -b "$BRANCH"
  
  # Apply fix (example: update dependency version)
  # sed -i 's/vulnerable-pkg@1.0/vulnerable-pkg@1.1/g' package.json
  
  git add .
  git commit -m "fix: update vulnerable-pkg to patched version

Addresses $ISSUE_URL"
  
  git push -u origin "$BRANCH"
  
  # Create MR
  glab mr create \
    --title "fix: address CVE-2024-12345" \
    --description "Updates vulnerable-pkg to patched version.

Related to: $ISSUE_URL" \
    --label "security"
  
  cd ..
done
```

## Working with Issues

### Create an Issue

```bash
glab issue create \
  --title "Bug: login fails on mobile" \
  --description "Steps to reproduce..." \
  --label "bug,mobile"
```

### List and View Issues

```bash
glab issue list
glab issue view 42
```

### Close an Issue

```bash
glab issue close 42
```

### Link MR to Issue

When creating an MR, reference the issue in the description:

```bash
glab mr create --description "Closes #42"
```

## Releases

### Create a Release

```bash
glab release create v1.0.0 \
  --name "Version 1.0.0" \
  --notes "$(cat CHANGELOG.md)"

# With assets
glab release create v1.0.0 --assets-links '[{"name":"binary","url":"https://..."}]'
```

### List Releases

```bash
glab release list
```

## API Access

For operations not covered by `glab` subcommands, use the API directly:

```bash
# GET request
glab api projects/:id/merge_requests

# POST request
glab api projects/:id/issues --method POST --field title="New issue"

# With pagination
glab api projects/:id/issues --paginate
```

## Guidelines

- **Verify remote**: Always confirm you're working with a GitLab repository before using `glab`
- **Check authentication**: Run `glab auth status` if commands fail with auth errors
- **Use draft MRs**: Create MRs as drafts (`--draft`) for work-in-progress
- **Reference issues**: Link MRs to issues using `Closes #123` or `Relates to #123` in descriptions
- **Consistent branch naming**: Use prefixes like `feature/`, `fix/`, `docs/` for clarity
- **Monitor CI**: Check pipeline status before requesting reviews (`glab ci status`)
- **Squash when appropriate**: Use `--squash` for cleaner history on feature branches
- **Self-managed instances**: Set `GITLAB_HOST` or use `glab auth login --hostname gitlab.example.com`
