module.exports = async ({ github, context }) => {
  const applyResult = process.env.APPLY_RESULT;
  const patchChanged = process.env.PATCH_CHANGED === "true";
  const changed = process.env.CODEX_CHANGED === "true";
  let body = process.env.CODEX_FINAL_MESSAGE;

  if (patchChanged && applyResult !== "success") {
    body = `${body}\n\n---\nCodex generated changes, but the workflow could not push them to this PR branch. Check the apply-changes job logs.`;
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
