const { addCardToProject, getZubeCardDetails } = require('./shared');
const { addLoggingToRequest } = require('./logger');

module.exports = async function onIssueOpened(context) {
  // unlabeled is called before labeled
  // IF NOT locked
  addLoggingToRequest(context);
  const {
    issue: { number },
  } = context;
  const details = await getZubeCardDetails(context);
  if (details) {
    // issue opened in Zube
    const { zubeWorkspace, zubeCategory, priority } = details;

    await addCardToProject({
      context,
      zubeWorkspace,
      zubeCategory,
      priority,
      addZubeLabel: false,
    });
    context.log.info(`Project card for issue #${number} is added`);
  }
  // issue opened in GitHub
};
