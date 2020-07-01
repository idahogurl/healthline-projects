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
const { getAccessJwt, zubeRequest } = require('./zube');
const {
  getZubeCard,
  moveProjectCard,
  findLabel,
  getZubeCardDetails,
  addCardToProject,
} = require('./shared');
const { deleteProjectCard } = require('./project-card');
const { logInfo } = require('./error-handler');
const { GET_PROJECT_FROM_ISSUE } = require('./graphql/project');
const { ADD_LABEL } = require('./graphql/label');
const { getLabelingHandlerAction, LABELING_HANDLER_ACTIONS } = require('./label-actions-shared');

async function assignPriority(context, priority) {
  const {
    issue: { node_id: issueId },
  } = context.payload;

  const search = `P${priority}`;
  const label = await findLabel(context, search);
  if (label) {
    await context.github.graphql(ADD_LABEL, {
      labelableId: issueId,
      labelIds: [label.id],
    });
  }
}

async function addCard(context) {
  const {
    issue: { number },
  } = context.payload;

  const { zubeWorkspace, zubeCategory, priority } = await getZubeCardDetails(context);
  if (zubeWorkspace) {
    const result = await addCardToProject({ context, zubeWorkspace, zubeCategory });
    if (result) {
      if (priority !== null) {
        await assignPriority(context, priority);
      }
    } else {
      await logInfo(
        `Could not match '${zubeCategory.toLowerCase()}' to GitHub project column`,
        'rollbar',
      );
    }
  } else {
    await logInfo(`GitHub issue #${number} could not be found in Zube`, 'rollbar');
  }
}

module.exports = async function onIssueLabeled(context) {
  const {
    label: addedLabel,
    issue: { node_id: issueId, number },
  } = context.payload;

  // Zube label?
  if (addedLabel.name.includes('[zube]')) {
    await logInfo(`New label '${addedLabel.name}' added to Issue #${number}`);
    const { node } = await context.github.graphql(GET_PROJECT_FROM_ISSUE, {
      id: issueId,
      number,
    });
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
        await logInfo(`Zube card unassigned from board. Project card deleted for issue #${number}`);
      }

      if (action === MOVE_CARD_COLUMN) {
        await moveProjectCard({ context, projectCardNode, newColumn: addedLabel.name });
        await logInfo(`Project card for issue #${number} is moved to ${addedLabel.name}`);
      }

      if (action === MOVE_CARD_PROJECT) {
        await deleteProjectCard(context, projectCardNode.node_id);
        await addCardToProject({ context, zubeWorkspace, zubeCategory });
        await logInfo(
          `Project card for issue #${number} is moved to ${zubeWorkspace}: ${zubeCategory}`,
        );
      }
    } else {
      await addCard(context);
      await logInfo(`Project card for issue #${number} is added`);
    }
  }

  // priority label?
  if (/^P\d$/.test(addedLabel.name)) {
    const accessJwt = await getAccessJwt();
    const zubeCard = await getZubeCard(context, accessJwt);
    const priority = parseInt(addedLabel.name.replace('P', ''), 10);
    if (zubeCard) {
      if (zubeCard.priority !== priority) {
        await zubeRequest({
          endpoint: `cards/${zubeCard.id}`,
          accessJwt,
          body: {
            ...zubeCard,
            priority,
          },
          method: 'PUT',
        });
      }
    } else {
      await logInfo(`GitHub issue #${number} could not be found in Zube`);
    }
  }
};
