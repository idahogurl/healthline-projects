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
  } else {
    const label = await findLabel(context, newLabel);
    if (label) {
      if (currentLabel) {
        await context.github.graphql(REMOVE_LABEL, {
          labelableId: issue.id,
          labelIds: [currentLabel.id],
        });
      }
      await context.github.graphql(ADD_LABEL, {
        labelableId: issue.id,
        labelIds: [label.id],
      });
    } else {
      // do nothing
    }
  }
}

module.exports = {
  getIssueLabels,
  addLabel,
  findLabel,
};
