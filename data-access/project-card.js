const {
  ADD_PROJECT_CARD,
  DELETE_PROJECT_CARD,
  MOVE_PROJECT_CARD,
  GET_PROJECT_CARD_DETAILS,
  GET_PROJECT_CARD_FROM_ISSUE,
} = require('../graphql/project-card');
const { getColumnsByProjectName } = require('./project');
const { addLabel, getIssueLabels } = require('./label');

function getMatchingColumn({ columns, newColumn, currentColumn }) {
  const newColumnName = newColumn.toLowerCase().replace('[zube]: ', '');
  if (currentColumn && newColumnName === currentColumn.toLowerCase()) {
    // card already in new column
  }
  return columns && columns.find((c) => c.name.toLowerCase() === newColumnName);
}

async function addProjectCard({
  context, zubeWorkspace, zubeCategory, priority,
}) {
  const {
    issue: { node_id: issueId, number },
    repository: { node_id: repoId },
  } = context.payload;

  // Zube card without a workspace means card is in triage
  // or a workspace without a matching GitHub project
  if (zubeWorkspace) {
    const columns = await getColumnsByProjectName({
      context,
      repoId,
      projectName: zubeWorkspace.name,
    });
    // get column matching Zube category
    const searchCategory = zubeCategory.toLowerCase();
    const column = columns.length && columns.find((c) => c.name.toLowerCase() === searchCategory);

    if (column) {
      // lock it
      // add project card to that matching column from matching project
      await context.github.graphql(ADD_PROJECT_CARD, {
        input: {
          projectColumnId: column.id,
          contentId: issueId,
        },
      });
      context.log.info(`Project card for issue #${number} is added`);

      const issue = await getIssueLabels(context, issueId);
      await addLabel({
        context,
        issue,
        existingLabelRegex: /\[zube\]:/,
        newLabel: `[zube]: ${zubeCategory}`,
      });
      if (priority) {
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
}

async function deleteProjectCard(context, cardId) {
  return context.github.graphql(DELETE_PROJECT_CARD, {
    input: {
      cardId,
    },
  });
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

async function getProjectCardFromIssue(context, issueId) {
  return context.github.graphql(GET_PROJECT_CARD_FROM_ISSUE, {
    id: issueId,
  });
}

async function getProjectCardDetails(context) {
  const { project_card: projectCardNode } = context.payload;
  // get column of project card
  const details = await context.github.graphql(GET_PROJECT_CARD_DETAILS, {
    id: projectCardNode.node_id,
  });
  const { node: projectCard } = details;
  // pull request being added to project do not have an issue
  if (projectCard.issue && projectCard.issue.id) {
    return projectCard;
  }
}

module.exports = {
  getMatchingColumn,
  addProjectCard,
  deleteProjectCard,
  moveProjectCard,
  getProjectCardDetails,
  getProjectCardFromIssue,
};
