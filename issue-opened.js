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
    // issue opened by Zube
    const { zubeWorkspace, zubeCategory, priority } = details;

    await addCardToProject({
      context,
      zubeWorkspace,
      zubeCategory,
      priority,
    });
    context.log.info(`Project card for issue #${number} is added`);
  }
  // the destination GitHub project cannot be determined without a Zube card
};
