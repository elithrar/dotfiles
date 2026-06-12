module.exports = async ({ github, context }) => {
  const applyResult = process.env.APPLY_RESULT;
  const patchChanged = process.env.PATCH_CHANGED === "true";
  const codexOutcome = process.env.CODEX_OUTCOME;
  const changed = process.env.CODEX_CHANGED === "true";
  const createdPrUrl = process.env.CREATED_PR_URL || "";
  let body = process.env.CODEX_FINAL_MESSAGE;

  if (codexOutcome && codexOutcome !== "success") {
    body = `Codex failed before producing a response.

Check the workflow logs for details: ${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
  } else if (patchChanged && applyResult !== "success") {
    body = `${body}\n\n---\nCodex generated changes, but the workflow could not apply or publish them. Check the apply-changes job logs.`;
  } else if (createdPrUrl) {
    body = `${body}\n\n---\nCodex opened a pull request with these changes: ${createdPrUrl}`;
  } else if (changed) {
    body = `${body}\n\n---\nCodex pushed changes to this PR branch.`;
  }

  const reviewCommentId = process.env.REVIEW_COMMENT_ID;
  const issueNumber = Number(process.env.TARGET_ISSUE_NUMBER);
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  if (reviewCommentId) {
    await github.rest.pulls.createReplyForReviewComment({
      owner,
      repo,
      pull_number: issueNumber,
      comment_id: Number(reviewCommentId),
      body,
    });
    return;
  }

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body,
  });
};
