/*
USE CASE:
When a user clicks 'Add to Source' Zube will:
1. Create GitHub issue
2. Add Zube label to GitHub issue (fires issue.labeled event)

HANDLER LOGIC
1. Check if Zube label was added
2. Query for issue's project cards
3. If no project card
  a. Create project card

  ELSE

  b. Does it need to be deleted, moved to different column, or moved to different project?
    See label-actions-shared.js

USE CASE
When a user moves card in Zube:
1. Adds Zube label to GitHub issue (fires issue.labeled event)
*/
const { addLoggingToRequest } = require('../logger');
const { getProjectFromIssue } = require('../data-access/project');
const { updatePriority, getAccessJwt } = require('../data-access/zube');
const { handleLabelEvent } = require('../data-access/label');

module.exports = async function onIssueLabeled(context) {
  // unlabeled is called before labeled
  // IF locked
  // unlock issue
  // return
  // ELSE
  addLoggingToRequest(context);
  const {
    label: addedLabel,
    issue: { node_id: issueId, number },
  } = context.payload;

  // Zube label was added?
  if (addedLabel.name.includes('[zube]')) {
    context.log.info(`New label '${addedLabel.name}' added to Issue #${number}`);
    const { node } = await getProjectFromIssue({ context, issueId, number });
    const { nodes: projectCards } = node.projectCards;
    await handleLabelEvent(context, projectCards);
  }

  // priority label?
  if (/^P\d$/.test(addedLabel.name)) {
    const priority = parseInt(addedLabel.name.replace('P', ''), 10);
    const accessJwt = await getAccessJwt(context);
    await updatePriority({ context, priority, accessJwt });
  }
};
