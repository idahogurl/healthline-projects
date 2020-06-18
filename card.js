const { getMatchingColumn } = require('./shared');
const { MOVE_PROJECT_CARD } = require('./graphql/project-card');

async function moveProjectCard({
  context, projectCardNode, newColumn, projectColumns = [],
}) {
  const { id: cardId, column, project } = projectCardNode;
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

module.exports = {
  moveProjectCard,
};
