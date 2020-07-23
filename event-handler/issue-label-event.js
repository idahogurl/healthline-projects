const {
  addProjectCard,
  deleteProjectCard,
  moveProjectCard,
} = require('../data-access/project-card');
const { LABELING_HANDLER_ACTIONS, getLabelingHandlerAction } = require('../label-actions-shared');
const { getZubeCardDetails } = require('../data-access/zube');

module.exports = async function onIssueLabeling(context, projectCards) {
  const {
    label,
    issue: { number },
  } = context.payload;

  const { zubeWorkspace, zubeCategory, priority } = await getZubeCardDetails(context);
  const [projectCardNode] = projectCards;
  if (projectCardNode) {
    const { DELETE_CARD, MOVE_CARD_PROJECT, MOVE_CARD_COLUMN } = LABELING_HANDLER_ACTIONS;

    const action = await getLabelingHandlerAction({
      zubeWorkspace,
      gitHubProject: projectCardNode.project,
      zubeCategory,
      gitHubColumn: projectCardNode.column,
    });

    if (action === DELETE_CARD) {
      await deleteProjectCard(context, projectCardNode.node_id);
      context.log.info(
        `Zube card unassigned from board. Project card deleted for issue #${number}`,
      );
    }

    if (action === MOVE_CARD_COLUMN) {
      await moveProjectCard({
        context,
        projectCardNode,
        newColumn: `[zube]: ${zubeCategory}`,
      });
      context.log.info(`Project card for issue #${number} is moved to ${label.name}`);
    }

    if (action === MOVE_CARD_PROJECT) {
      await deleteProjectCard(context, projectCardNode.node_id);
      await addProjectCard({ context, zubeWorkspace, zubeCategory });
      context.log.info(
        `Project card for issue #${number} is moved to ${zubeWorkspace.name}: ${zubeCategory}`,
      );
    }
  } else {
    await addProjectCard({
      context,
      zubeWorkspace,
      zubeCategory,
      priority,
    });
  }
};
