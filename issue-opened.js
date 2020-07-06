const { addCardToProject, getZubeCardDetails } = require('./shared');
const { logInfo } = require('./error-handler');

module.exports = async function onIssueOpened(context) {
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
  await logInfo(`Project card for issue #${number} is added`);
};
