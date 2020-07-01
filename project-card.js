const { DELETE_PROJECT_CARD } = require('./graphql/project-card');

async function deleteProjectCard(context, cardId) {
  return context.github.graphql(DELETE_PROJECT_CARD, {
    input: {
      cardId,
    },
  });
}

module.exports = {
  deleteProjectCard,
};
