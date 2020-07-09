const { addCardToProject, getZubeCardDetails } = require('./shared');
const { addLoggingToRequest } = require('./logger');

module.exports = async function onIssueOpened(context) {
  addLoggingToRequest(context);
  const {
    issue: { number },
  } = context;
  const { zubeWorkspace, zubeCategory, priority } = await getZubeCardDetails(context);

  await addCardToProject({
    context,
    zubeWorkspace,
    zubeCategory,
    priority,
  });
  context.log.info(`Project card for issue #${number} is added`);
};
