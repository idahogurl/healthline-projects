const { getProjectCardDetails } = require('../data-access/project-card');
const { addLabel } = require('../data-access/label');
const { moveZubeCard } = require('../data-access/zube');
const { addLoggingToRequest } = require('../logger');
// const { client, lock } = require('./redis');

module.exports = async function onCardMoved(context) {
  addLoggingToRequest(context);
  const projectCardDetails = await getProjectCardDetails(context);
  if (projectCardDetails) {
    const {
      issue,
      column: { name },
    } = projectCardDetails;
    // move to different board in Zube
    const label = `[zube]: ${name}`;
    // const redis = client();
    // await lock(redis, issue.number);
    await addLabel({
      context,
      issue,
      existingLabelRegex: /\[zube\]:/,
      newLabel: label,
    });
    await moveZubeCard(context, projectCardDetails);
  }
};
