const {
  GET_ISSUE_LABELS, GET_LABEL, REMOVE_LABEL, ADD_LABEL,
} = require('../graphql/label');
const { addProjectCard, deleteProjectCard, moveProjectCard } = require('./project-card');
const { LABELING_HANDLER_ACTIONS, getLabelingHandlerAction } = require('../label-actions-shared');
const { getZubeCardDetails } = require('./zube');

async function getIssueLabels(context, issueId) {
  const { node: issue } = await context.github.graphql(GET_ISSUE_LABELS, {
    id: issueId,
  });
  return issue;
}

async function findLabel(context, search) {
  // get the matching label
  const {
    name: repoName,
    owner: { login },
  } = context.payload.repository;

  const {
    repository: {
      labels: { nodes: labelNodes },
    },
  } = await context.github.graphql(GET_LABEL, {
    name: repoName,
    owner: login,
    search,
  });

  const label = labelNodes.find((l) => l.name.toLowerCase() === search.toLowerCase());
  if (label) {
    return label;
  }
  context.log.warn(context, `Could not find '${search}' in GitHub labels`);
}

async function removeLabel(context, issue, currentLabel) {
  await context.github.graphql(REMOVE_LABEL, {
    labelableId: issue.id,
    labelIds: [currentLabel.id],
  });
}

/**
Finds label and if found adds label to issue unless issue has the label already
@returns {Promise<boolean>} whether the add query ran not whether query ran successfully
*/
async function addLabel({
  context, issue, existingLabelRegex, newLabel,
}) {
  const {
    labels: { nodes: labels },
  } = issue;
  // find Zube label in issue's assigned labels
  const currentLabel = labels.find((l) => existingLabelRegex.test(l.name));

  if (currentLabel && currentLabel.name.toLowerCase() === newLabel.toLowerCase()) {
    // do not remove since issue already has label assigned
    return false;
  }
  const label = await findLabel(context, newLabel);
  if (label) {
    if (currentLabel) {
      await removeLabel(context, issue, currentLabel);
    }
    await context.github.graphql(ADD_LABEL, {
      labelableId: issue.id,
      labelIds: [label.id],
    });
    return true;
  }
}

async function handleLabelEvent(context, projectCards) {
  const {
    label,
    issue: { number },
  } = context.payload;

  const { zubeWorkspace, zubeCategory, priority } = await getZubeCardDetails(context);
  const [projectCardNode] = projectCards;
  if (projectCardNode) {
    const { DELETE_CARD, MOVE_CARD_PROJECT, MOVE_CARD_COLUMN } = LABELING_HANDLER_ACTIONS;

    const action = await getLabelingHandlerAction({
      context,
      zubeWorkspace,
      gitHubProject: projectCardNode.project,
      zubeCategory,
      gitHubColumn: projectCardNode.column,
    });

    if (action === DELETE_CARD) {
      // Line 97 needs coverage
      await deleteProjectCard(context, projectCardNode.node_id);
      context.log.info(
        `Zube card unassigned from board. Project card deleted for issue #${number}`,
      );
    }

    if (action === MOVE_CARD_COLUMN) {
      await moveProjectCard({
        context,
        projectCardNode,
        newColumn: `[zube]: ${zubeCategory}`,
      });
      context.log.info(`Project card for issue #${number} is moved to ${label.name}`);
    }

    if (action === MOVE_CARD_PROJECT) {
      await deleteProjectCard(context, projectCardNode.node_id);
      await addProjectCard({ context, zubeWorkspace, zubeCategory });
      context.log.info(
        `Project card for issue #${number} is moved to ${zubeWorkspace.name}: ${zubeCategory}`,
      );
    }
  } else {
    await addProjectCard({
      context,
      zubeWorkspace,
      zubeCategory,
      priority,
    });
  }
}

module.exports = {
  getIssueLabels,
  addLabel,
  findLabel,
  removeLabel,
  handleLabelEvent,
};
