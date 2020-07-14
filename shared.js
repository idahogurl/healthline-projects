const { zubeRequest, getAccessJwt } = require('./zube');
const zubeWorkspaces = require('./zube-workspaces.json');
const {
  GET_ISSUE_FROM_PROJECT_CARD,
  MOVE_PROJECT_CARD,
  ADD_PROJECT_CARD,
} = require('./graphql/project-card');
const { GET_PROJECT_COLUMNS } = require('./graphql/project');
const {
  GET_LABEL, REMOVE_LABEL, ADD_LABEL, GET_ISSUE_LABELS,
} = require('./graphql/label');

function getMatchingColumn({ columns, newColumn, currentColumn }) {
  const newColumnName = newColumn.toLowerCase().replace('[zube]: ', '');
  if (currentColumn && newColumnName === currentColumn.toLowerCase()) {
    // card already in new column
  }
  return columns && columns.find((c) => c.name.toLowerCase() === newColumnName);
}

function getZubeWorkspace({ id, name }) {
  if (id) {
    return zubeWorkspaces.find((w) => w.id === id);
  }
  return zubeWorkspaces.find((w) => w.name === name.toLowerCase());
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

async function getZubeCard(context, accessJwt) {
  const {
    issue: { title, number },
  } = context.payload;
  // find the Zube card
  // Each card has a 'search_key' field which (as far as I can tell) must be an indexed field.
  // Searching using its value cuts the response time by half. Its value is the card's title
  // in all lower case. Also, searching by the first 2 words as cuts the time in half.
  const search = title.toLowerCase().split(' ').slice(0, 2).join(' ');

  const params = {
    endpoint: `projects/${process.env.ZUBE_PROJECT_ID}/cards`,
    qs: { search },
    accessJwt,
  };
  const { data } = await zubeRequest(context, params);
  // find issue in Zube cards
  const zubeCard = data
    .filter((d) => d.github_issue !== null)
    .find((d) => d.github_issue.number === number);
  return zubeCard;
}

async function getZubeCardDetails(context) {
  const accessJwt = await getAccessJwt(context);
  const zubeCard = await getZubeCard(context, accessJwt);
  if (zubeCard) {
    const { workspace_id: workspaceId, category_name: zubeCategory, priority } = zubeCard;

    const zubeWorkspace = getZubeWorkspace({ id: workspaceId });
    return { zubeWorkspace, zubeCategory, priority };
  }
}
async function moveZubeCard(context, result) {
  const { column, issue } = result;
  const accessJwt = await getAccessJwt(context);
  // card created in GitHub, move Zube ticket from triage to matching board & category
  context.payload.issue = issue;
  const { id, workspace_id: workspaceId } = await getZubeCard(context, accessJwt);
  const {
    name: columnName,
    project: { name: projectName },
  } = column;

  const workspace = getZubeWorkspace({ name: projectName });
  // move if a different workspace than the current
  if (workspace && workspace.id !== workspaceId) {
    await zubeRequest(context, {
      endpoint: `cards/${id}/move`,
      accessJwt,
      body: {
        destination: {
          position: 0,
          type: 'category',
          name: columnName,
          workspace_id: workspace.id,
        },
      },
      method: 'PUT',
    });
  }
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

async function getColumnsByProjectName({ context, repoId, projectName }) {
  const { node: repoNode } = await context.github.graphql(GET_PROJECT_COLUMNS, {
    id: repoId,
    project: projectName,
  });
  const [projectNode] = repoNode.projects.nodes;
  if (projectNode) {
    return projectNode.columns.nodes;
  }
  return {};
}

async function addCardToProject({
  context, zubeWorkspace, zubeCategory, priority,
}) {
  const {
    issue: { node_id: issueId },
    repository: { node_id: repoId },
  } = context.payload;
  const columns = await getColumnsByProjectName({
    context,
    repoId,
    projectName: zubeWorkspace.name,
  });
  // get column matching Zube category
  const searchCategory = zubeCategory.toLowerCase();
  const column = columns.length && columns.find((c) => c.name.toLowerCase() === searchCategory);
  if (column) {
    // add project card to that matching column from matching project
    await context.github.graphql(ADD_PROJECT_CARD, {
      input: {
        projectColumnId: column.id,
        contentId: issueId,
      },
    });
    const { node: issue } = await context.github.graphql(GET_ISSUE_LABELS, {
      id: issueId,
    });
    await addLabel({
      context,
      issue,
      existingLabelRegex: /\[zube\]:/,
      newLabel: `[zube]: ${zubeCategory}`,
    });
    if (priority !== null) {
      await addLabel({
        context,
        issue,
        existingLabelRegex: /^P\d$/,
        newLabel: `P${priority}`,
      });
    }
    return true;
  }
}

async function moveProjectCard({
  context, projectCardNode, newColumn, projectColumns = [],
}) {
  const { node_id: cardId, column, project } = projectCardNode;
  const columns = (project && project.columns && project.columns.nodes) || projectColumns;
  // find column in GitHub project that matches Zube label
  const matchingColumn = getMatchingColumn({
    columns,
    newColumn,
    currentColumn: column && column.name,
  });

  if (matchingColumn) {
    await context.github.graphql(MOVE_PROJECT_CARD, {
      input: {
        cardId,
        columnId: matchingColumn.id,
      },
    });
  }
}

module.exports = {
  getMatchingColumn,
  getZubeCard,
  getZubeCardDetails,
  moveZubeCard,
  getIssueFromCard,
  getColumnsByProjectName,
  addCardToProject,
  moveProjectCard,
  addLabel,
  findLabel,
};
