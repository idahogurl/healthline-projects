/* USE CASE
Issue assigned to project board (fires project_card.created)

HANDLER LOGIC
1. Find the issue of card
2. Does that issue already have a Zube label?
    a. Move card to column matching Zube label

    ELSE

    a. Query zube for card
    b. Query for categories in Zube
    c. Move card to matching category in Zube
*/

const {
  getIssueFromCard,
  moveZubeCard,
  getColumnsByProjectName,
  moveProjectCard,
} = require('./shared');
const { addLoggingToRequest } = require('./logger');

module.exports = async function onCardCreated(context) {
  addLoggingToRequest(context);
  const {
    project_card: projectCardNode,
    repository: { node_id: repoId },
  } = context.payload;

  const result = await getIssueFromCard(context, projectCardNode.node_id);

  if (result) {
    const { issue, column } = result;
    projectCardNode.column = column;

    const {
      labels: { nodes: labels },
    } = issue;
    const zubeLabel = labels.find((l) => l.name.includes('[zube]'));
    if (zubeLabel) {
      if (zubeLabel.name.toLowerCase() === `[zube]: ${column.name.toLowerCase()}`) {
        // do nothing if column is the same as the label
      } else {
        const columns = await getColumnsByProjectName({
          context,
          repoId,
          projectName: column.project.name,
        });
        // issue already has a Zube label, move to matching projects column
        return moveProjectCard({
          context,
          projectCardNode,
          newColumn: zubeLabel.name,
          projectColumns: columns,
        });
      }
    }
    // move from triage
    return moveZubeCard(context, result);
  }
};
