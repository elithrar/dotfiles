const REACTIONS = new Set([
  "THUMBS_UP",
  "THUMBS_DOWN",
  "LAUGH",
  "HOORAY",
  "CONFUSED",
  "HEART",
  "ROCKET",
  "EYES",
]);

const reactionContent = (value, fallback = "") => {
  const content = value || fallback;
  if (!content) {
    return "";
  }
  if (!REACTIONS.has(content)) {
    throw new Error(`Unsupported reaction content: ${content}`);
  }
  return content;
};

module.exports = async ({ github, core }) => {
  const subjectId = process.env.REACTION_SUBJECT_ID;
  if (!subjectId) {
    return;
  }

  const removeContent = reactionContent(process.env.REMOVE_REACTION_CONTENT);
  const addContent = reactionContent(process.env.ADD_REACTION_CONTENT, "THUMBS_UP");

  if (removeContent) {
    try {
      await github.graphql(`
        mutation RemoveReaction($subjectId: ID!, $content: ReactionContent!) {
          removeReaction(input: { subjectId: $subjectId, content: $content }) {
            subject {
              id
            }
          }
        }
      `, { subjectId, content: removeContent });
    } catch (error) {
      core.warning(`Could not remove ${removeContent} reaction: ${error.message}`);
    }
  }

  if (addContent) {
    try {
      await github.graphql(`
        mutation AddReaction($subjectId: ID!, $content: ReactionContent!) {
          addReaction(input: { subjectId: $subjectId, content: $content }) {
            reaction {
              content
            }
          }
        }
      `, { subjectId, content: addContent });
    } catch (error) {
      core.warning(`Could not add ${addContent} reaction: ${error.message}`);
    }
  }
};
