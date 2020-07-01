const { logInfo } = require('./error-handler');
const { GET_PROJECT_CARD_FROM_ISSUE, DELETE_PROJECT_CARD } = require('./graphql/project-card');
const { getZubeCardDetails, addCardToProject, moveProjectCard } = require('./shared');
const { LABELING_HANDLER_ACTIONS, getLabelingHandlerAction } = require('./label-actions-shared');

module.exports = async function onIssueUnlabeled(context) {
  const {
    issue: { node_id: id, number },
    label,
  } = context.payload;

  if (label.name.includes('[zube]: ')) {
    await logInfo(`Label '${label.name}' removed from Issue #${number}`);
    const {
      node: {
        projectCards: { nodes: projectCards },
      },
    } = await context.github.graphql(GET_PROJECT_CARD_FROM_ISSUE, {
      id,
    });
    const { zubeWorkspace, zubeCategory } = await getZubeCardDetails(context);
    const [projectCardNode] = projectCards;
    if (projectCardNode) {
      const { DELETE_CARD, MOVE_CARD_PROJECT, MOVE_CARD_COLUMN } = LABELING_HANDLER_ACTIONS;

      const action = await getLabelingHandlerAction({
        context,
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
        await logInfo(`Zube card unassigned from board. Project card deleted for issue #${number}`);
      }

      if (action === MOVE_CARD_COLUMN) {
        await moveProjectCard({
          context,
          projectCardNode,
          newColumn: `[zube]: ${zubeCategory.name}`,
        });
        await logInfo(`Project card for issue #${number} is moved to ${label.name}`);
      }

      if (action === MOVE_CARD_PROJECT) {
        await context.github.graphql(DELETE_PROJECT_CARD, {
          input: {
            cardId: projectCardNode.node_id,
          },
        });
        await addCardToProject({ context, zubeWorkspace, zubeCategory });
        await logInfo(
          `Project card for issue #${number} is moved to ${zubeWorkspace}: ${zubeCategory}`,
        );
      }
    } else {
      await addCardToProject({ context, zubeWorkspace, zubeCategory });
      await logInfo(`Project card created for issue #${number}`);
    }
  }
};
