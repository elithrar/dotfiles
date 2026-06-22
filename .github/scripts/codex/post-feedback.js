module.exports = async ({ github, context }) => {
  const applyResult = process.env.APPLY_RESULT;
  const patchChanged = process.env.PATCH_CHANGED === "true";
  const patchBlocked = process.env.PATCH_BLOCKED === "true";
  const patchBlockedPaths = process.env.PATCH_BLOCKED_PATHS || "";
  const codexOutcome = process.env.CODEX_OUTCOME;
  const changed = process.env.CODEX_CHANGED === "true";
  const createdPrUrl = process.env.CREATED_PR_URL || "";
  let body = process.env.CODEX_FINAL_MESSAGE || "Codex completed without a final message.";

  const appendStatus = (message) => {
    body = `${body}\n\n---\n${message}`;
  };

  if (codexOutcome && codexOutcome !== "success") {
    body = `Codex failed before producing a response.

Check the workflow logs for details: ${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
  } else if (patchBlocked) {
    appendStatus(`Codex changed blocked paths, so no patch or PR was published.

Blocked paths:
${patchBlockedPaths}

A maintainer should review these changes manually before applying them.`);
  } else if (patchChanged && applyResult !== "success") {
    appendStatus("Codex generated changes, but the workflow could not apply or publish them. No PR was opened. Check the apply-changes job logs.");
  } else if (createdPrUrl) {
    appendStatus(`Codex opened a pull request with these changes: ${createdPrUrl}`);
  } else if (changed) {
    appendStatus("Codex pushed changes to this PR branch.");
  } else if (patchChanged) {
    appendStatus("Codex generated changes, but the apply job did not report a pushed branch or PR URL. No PR was opened. Check the apply-changes job logs.");
  } else {
    appendStatus("Codex did not capture file changes, so no PR was opened.");
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
