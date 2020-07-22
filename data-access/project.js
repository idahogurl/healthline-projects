const { GET_PROJECT_COLUMNS, GET_PROJECT_FROM_ISSUE } = require('../graphql/project');

async function getColumnsByProjectName({ context, repoId, projectName }) {
  const { node: repoNode } = await context.github.graphql(GET_PROJECT_COLUMNS, {
    id: repoId,
    project: projectName,
  });
  const [projectNode] = repoNode.projects.nodes;
  if (projectNode) {
    return projectNode.columns.nodes;
  }
  return [];
}

async function getProjectFromIssue({ context, issueId, number }) {
  return context.github.graphql(GET_PROJECT_FROM_ISSUE, {
    id: issueId,
    number,
  });
}

module.exports = {
  getColumnsByProjectName,
  getProjectFromIssue,
};
