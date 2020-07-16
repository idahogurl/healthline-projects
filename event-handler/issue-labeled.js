/*
USE CASE:
When a user clicks 'Add to Source' Zube will:
1. Create GitHub issue
2. Add Zube label to GitHub issue (fires issue.labeled event)

HANDLER LOGIC
1. Check if Zube label
2. Query for issue's project cards
3. If no project card
  a. Create project card

  ELSE

  a. Does it already have a Zube label?
  b. Does it already have the same Zube label
      Do nothing
        ELSE
      Move to GitHub project column matching Zube label

USE CASE
When a user moves card in Zube:
1. Adds Zube label to GitHub issue (fires issue.labeled event)
*/
const {
  deleteProjectCard,
  moveProjectCard,
  addProjectCard,
} = require('../data-access/project-card');
const { addLoggingToRequest } = require('../logger');
const { getProjectFromIssue } = require('../data-access/project');
const { getLabelingHandlerAction, LABELING_HANDLER_ACTIONS } = require('../label-actions-shared');
const { getZubeCardDetails, updatePriority, getAccessJwt } = require('../data-access/zube');

async function addCard(context) {
  const {
    issue: { number },
  } = context.payload;

  const { zubeWorkspace, zubeCategory, priority } = await getZubeCardDetails(context);
  if (zubeWorkspace) {
    const result = await addProjectCard({
      context,
      zubeWorkspace,
      zubeCategory,
      priority,
    });
    if (result) {
      // nop
    } else {
      context.log.warn(`Could not match '${zubeCategory.toLowerCase()}' to GitHub project column`);
    }
  } else {
    context.log.warn(`GitHub issue #${number} could not be found in Zube`);
  }
}

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

  // Zube label?
  if (addedLabel.name.includes('[zube]')) {
    context.log.info(`New label '${addedLabel.name}' added to Issue #${number}`);
    const { node } = await getProjectFromIssue({ context, issueId, number });
    const { nodes: projectCards } = node.projectCards;
    const [projectCardNode] = projectCards;
    if (projectCardNode) {
      const { DELETE_CARD, MOVE_CARD_PROJECT, MOVE_CARD_COLUMN } = LABELING_HANDLER_ACTIONS;

      const { zubeWorkspace, zubeCategory } = await getZubeCardDetails(context);

      const action = await getLabelingHandlerAction({
        context,
        zubeWorkspace,
        gitHubProject: projectCardNode.project,
        zubeCategory,
        gitHubColumn: projectCardNode.column,
      });

      if (action === DELETE_CARD) {
        await deleteProjectCard(context, projectCardNode.node_id);
        context.log.info(
          `Zube card unassigned from board. Project card deleted for issue #${number}`,
        );
      }

      if (action === MOVE_CARD_COLUMN) {
        await moveProjectCard({ context, projectCardNode, newColumn: addedLabel.name });
        context.log.info(`Project card for issue #${number} is moved to ${addedLabel.name}`);
      }

      if (action === MOVE_CARD_PROJECT) {
        await deleteProjectCard(context, projectCardNode.node_id);
        await addProjectCard({ context, zubeWorkspace, zubeCategory });
        context.log.info(
          `Project card for issue #${number} is moved to ${zubeWorkspace}: ${zubeCategory}`,
        );
      }
    } else {
      await addCard(context);
      context.log.info(`Project card for issue #${number} is added`);
    }
  }

  // priority label?
  if (/^P\d$/.test(addedLabel.name)) {
    const priority = parseInt(addedLabel.name.replace('P', ''), 10);
    const accessJwt = await getAccessJwt(context);
    await updatePriority({ context, priority, accessJwt });
  } else {
    context.log.warn(`GitHub issue #${number} could not be found in Zube`);
  }
};
