const { addCardToProject, getZubeCardDetails } = require('./shared');
const { logInfo } = require('./logger');
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
  logInfo(context, `Project card for issue #${number} is added`);
};
