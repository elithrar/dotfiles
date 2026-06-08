module.exports = async ({ github, context, core }) => {
  const payload = context.payload;
  const body = context.eventName === "pull_request_review"
    ? payload.review?.body ?? ""
    : payload.comment?.body ?? "";
  const match = body.match(/^\/(codex|review)(?:\s+([\s\S]*))?$/);

  core.setOutput("is_valid", match ? "true" : "false");
  if (!match) {
    return;
  }

  const isPullRequestIssueComment = context.eventName === "issue_comment" && !!payload.issue?.pull_request;
  const prNumber = payload.pull_request?.number ?? (isPullRequestIssueComment ? payload.issue.number : "");
  const targetIssueNumber = payload.issue?.number ?? prNumber;
  let actorPermission = "none";
  let canRun = false;
  let canModify = false;
  let headRef = "";
  let headRepo = "";

  try {
    const { data } = await github.rest.repos.getCollaboratorPermissionLevel({
      owner: context.repo.owner,
      repo: context.repo.repo,
      username: payload.sender.login,
    });
    actorPermission = data.permission;
  } catch (error) {
    core.warning(`Could not determine ${payload.sender.login}'s repository permission: ${error.message}`);
  }
  canRun = ["admin", "maintain", "write"].includes(actorPermission);

  if (prNumber) {
    const { data: pr } = await github.rest.pulls.get({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: Number(prNumber),
    });
    headRef = pr.head.ref;
    headRepo = pr.head.repo.full_name;
    canModify = canRun && headRepo === `${context.repo.owner}/${context.repo.repo}`;
  }

  core.setOutput("command", match[1]);
  core.setOutput("user_prompt", (match[2] ?? "").trim());
  core.setOutput("pr_number", prNumber);
  core.setOutput("actor_permission", actorPermission);
  core.setOutput("can_run", canRun ? "true" : "false");
  core.setOutput("can_modify", canModify ? "true" : "false");
  core.setOutput("head_ref", headRef);
  core.setOutput("head_repo", headRepo);
  core.setOutput("review_comment_id", context.eventName === "pull_request_review_comment" ? payload.comment.id : "");
  core.setOutput("reaction_subject_id", payload.comment?.node_id ?? payload.review?.node_id ?? "");
  core.setOutput("target_issue_number", targetIssueNumber);
  core.setOutput("trigger_url", payload.comment?.html_url ?? payload.review?.html_url ?? payload.issue?.html_url ?? "");
};
