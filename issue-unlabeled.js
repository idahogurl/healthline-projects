const { GET_PROJECT_CARD_FROM_ISSUE, DELETE_PROJECT_CARD } = require('./graphql/project-card');
const { getZubeCardDetails, addCardToProject, moveProjectCard } = require('./shared');
const { LABELING_HANDLER_ACTIONS, getLabelingHandlerAction } = require('./label-actions-shared');

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
    const { zubeWorkspace, zubeCategory } = await getZubeCardDetails(context);
    const [projectCardNode] = projectCards;
    if (projectCardNode) {
      const { DELETE_CARD, MOVE_CARD_PROJECT, MOVE_CARD_COLUMN } = LABELING_HANDLER_ACTIONS;

      const action = getLabelingHandlerAction({
        action: context.payload.action,
        zubeWorkspace,
        gitHubProject: projectCardNode.project,
        zubeCategory,
        gitHubColumn: projectCardNode.column,
      });

      if (action === DELETE_CARD) {
        await context.github.graphql(DELETE_PROJECT_CARD, {
          input: {
            cardId: projectCardNode.node_id,
          },
        });
      }

      if (action === MOVE_CARD_COLUMN) {
        moveProjectCard({ context, projectCardNode, newColumn: `[zube]: ${zubeCategory.name}` });
      }

      if (action === MOVE_CARD_PROJECT) {
        await context.github.graphql(DELETE_PROJECT_CARD, {
          input: {
            cardId: projectCardNode.node_id,
          },
        });
        await addCardToProject({ context, zubeWorkspace, zubeCategory });
      }
    }
  }
};
