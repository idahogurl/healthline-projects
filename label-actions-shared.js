const { getColumnsByProjectName } = require('./data-access/project');

const LABELING_HANDLER_ACTIONS = {
  DELETE_CARD: 'delete-card',
  MOVE_CARD_PROJECT: 'move-card-project',
  MOVE_CARD_COLUMN: 'move-card-column',
};

async function getLabelingHandlerAction({
  context,
  zubeWorkspace,
  gitHubProject,
  zubeCategory,
  gitHubColumn,
}) {
  const { DELETE_CARD, MOVE_CARD_PROJECT, MOVE_CARD_COLUMN } = LABELING_HANDLER_ACTIONS;
  if (!zubeWorkspace) {
    // Zube card was moved to triage or workspace without a matching GitHub project
    return DELETE_CARD;
  }

  if (zubeWorkspace.name.toLowerCase() !== gitHubProject.name.toLowerCase()) {
    // Zube workspace changed
    const {
      repository: { node_id: repoId },
    } = context.payload;
    const columns = await getColumnsByProjectName({
      context,
      repoId,
      projectName: zubeWorkspace.name,
    });
    if (columns.length) {
      // Zube card was moved to a workspace that matches a GitHub project
      return MOVE_CARD_PROJECT;
    }
  }

  if (gitHubColumn && zubeCategory.toLowerCase() !== gitHubColumn.name.toLowerCase()) {
    // Zube card was moved to a category (aka column) that matches a GitHub project
    // column in its current GitHub project
    return MOVE_CARD_COLUMN;
  }
}

module.exports = {
  LABELING_HANDLER_ACTIONS,
  getLabelingHandlerAction,
};
