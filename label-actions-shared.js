const LABELING_HANDLER_ACTIONS = {
  DELETE_CARD: 'delete-card',
  MOVE_CARD_PROJECT: 'move-card-project',
  MOVE_CARD_COLUMN: 'move-card-column',
};

function getLabelingHandlerAction({
  zubeWorkspace, gitHubProject, zubeCategory, gitHubColumn,
}) {
  const { DELETE_CARD, MOVE_CARD_PROJECT, MOVE_CARD_COLUMN } = LABELING_HANDLER_ACTIONS;
  if (!zubeWorkspace) {
    return DELETE_CARD;
  }
  // does that project exist in GitHub?
  if (zubeWorkspace.name.toLowerCase() !== gitHubProject.name.toLowerCase()) {
    return MOVE_CARD_PROJECT;
  }

  if (gitHubColumn && zubeCategory.toLowerCase() !== gitHubColumn.name.toLowerCase()) {
    return MOVE_CARD_COLUMN;
  }
}

module.exports = {
  LABELING_HANDLER_ACTIONS,
  getLabelingHandlerAction,
};
