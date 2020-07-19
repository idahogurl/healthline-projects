const { addLoggingToRequest } = require('../logger');
const { getProjectCardFromIssue } = require('../data-access/project-card');
const { handleLabelEvent } = require('../data-access/label');

module.exports = async function onIssueUnlabeled(context) {
  addLoggingToRequest(context);
  const {
    issue: { node_id: id, number },
    label,
  } = context.payload;

  if (label.name.includes('[zube]: ')) {
    context.log.info(`Label '${label.name}' removed from Issue #${number}`);
    const {
      node: {
        projectCards: { nodes: projectCards },
      },
    } = await getProjectCardFromIssue(context, id);

    await handleLabelEvent(context, projectCards);
  }
};
