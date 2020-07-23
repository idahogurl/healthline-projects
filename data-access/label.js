const {
  GET_ISSUE_LABELS, GET_LABEL, REMOVE_LABEL, ADD_LABEL,
} = require('../graphql/label');

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

module.exports = {
  getIssueLabels,
  addLabel,
  findLabel,
  removeLabel,
};
