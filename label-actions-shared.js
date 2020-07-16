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
    return DELETE_CARD;
  }

  if (zubeWorkspace.name.toLowerCase() !== gitHubProject.name.toLowerCase()) {
    // does the project exist is GitHub?
    const {
      repository: { node_id: repoId },
    } = context.payload;
    const columns = await getColumnsByProjectName({
      context,
      repoId,
      projectName: zubeWorkspace.name,
    });
    if (columns.length) {
      return MOVE_CARD_PROJECT;
    }
    return DELETE_CARD;
  }

  if (gitHubColumn && zubeCategory.toLowerCase() !== gitHubColumn.name.toLowerCase()) {
    return MOVE_CARD_COLUMN;
  }
}

module.exports = {
  LABELING_HANDLER_ACTIONS,
  getLabelingHandlerAction,
};
