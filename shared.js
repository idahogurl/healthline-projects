const { zubeRequest } = require('./zube');
const { logInfo } = require('./error-handler');
const { GET_ISSUE_FROM_PROJECT_CARD, MOVE_PROJECT_CARD } = require('./graphql/project-card');
const { GET_PROJECT_COLUMNS } = require('./graphql/project');
const { GET_LABEL } = require('./graphql/label');

function getMatchingColumn({ columns, newColumn, currentColumn }) {
  const newColumnName = newColumn.toLowerCase().replace('[zube]: ', '');
  if (newColumnName === currentColumn.toLowerCase()) {
    // card already in new column
  }
  return columns.find((c) => c.name.toLowerCase() === newColumnName);
}

async function getZubeCard(context, accessJwt) {
  const {
    issue: { title, number },
  } = context.payload;

  // find the Zube card
  const search = title.split(' ').slice(0, 5).join(' ');
  // get first 5 words to speed up request
  const params = {
    endpoint: `projects/${process.env.ZUBE_PROJECT_ID}/cards?search=${search}`,
    accessJwt,
  };
  const { data } = await zubeRequest(params);
  // find issue in Zube cards
  const zubeCard = data
    .filter((d) => d.github_issue !== null)
    .find((d) => d.github_issue.number === number);

  return zubeCard;
}

async function getIssueFromCard(context) {
  const { project_card: projectCardNode } = context.payload;
  // get column of project card
  const { node: projectCard } = await context.github.graphql(GET_ISSUE_FROM_PROJECT_CARD, {
    id: projectCardNode.node_id,
  });
  // get the column & issue from event's project card
  const { column, content: issue } = projectCard;

  // pull request being added to project do not have an issue
  if (issue && issue.id) {
    return { issue, column };
  }
}

async function getColumnsByProjectName({ context, repoId, projectName }) {
  const { node: repoNode } = await context.github.graphql(GET_PROJECT_COLUMNS, {
    id: repoId,
    project: projectName,
  });

  const [projectNode] = repoNode.projects.nodes;
  return projectNode.columns;
}

async function moveProjectCard({
  context, projectCardNode, newColumn, projectColumns = [],
}) {
  const { node_id: cardId, column, project } = projectCardNode;
  const columns = (project && project.columns.nodes) || projectColumns;
  // find column in GitHub project that matches Zube label
  const matchingColumn = getMatchingColumn({
    columns,
    newColumn,
    currentColumn: column.name,
  });

  if (matchingColumn) {
    return context.github.graphql(MOVE_PROJECT_CARD, {
      input: {
        cardId,
        columnId: matchingColumn.id,
      },
    });
  }
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
  logInfo(`Could not find '${search}' in GitHub labels`);
}

module.exports = {
  getMatchingColumn,
  getZubeCard,
  getIssueFromCard,
  getColumnsByProjectName,
  moveProjectCard,
  findLabel,
};
