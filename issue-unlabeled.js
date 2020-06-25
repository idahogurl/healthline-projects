const { GET_PROJECT_CARD_FROM_ISSUE, DELETE_PROJECT_CARD } = require('./graphql/project-card');

module.exports = async function onIssueUnlabeled(context) {
  const { issue, label } = context.payload;

  if (label.name.includes('[zube]: ')) {
    const {
      node: {
        projectCards: { nodes: projectCards },
      },
    } = await context.github.graphql(GET_PROJECT_CARD_FROM_ISSUE, {
      id: issue.node_id,
    });

    if (projectCards.length) {
      const [projectCard] = projectCards;
      await context.github.graphql(DELETE_PROJECT_CARD, {
        input: {
          cardId: projectCard.id,
        },
      });
    }
  }
};
