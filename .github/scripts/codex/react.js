module.exports = async ({ github, core }) => {
  const subjectId = process.env.REACTION_SUBJECT_ID;
  if (!subjectId) {
    return;
  }

  try {
    await github.graphql(`
      mutation AddReaction($subjectId: ID!) {
        addReaction(input: { subjectId: $subjectId, content: THUMBS_UP }) {
          reaction {
            content
          }
        }
      }
    `, { subjectId });
  } catch (error) {
    core.warning(`Could not add thumbs-up reaction: ${error.message}`);
  }
};
