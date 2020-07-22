/* USE CASE
Issue assigned to project board (fires project_card.created)

HANDLER LOGIC
1. Find the issue of card
2. Does that issue already have a Zube label?
    a. Move card to column matching Zube label

    ELSE

    b. Move card to matching workspace & category in Zube
*/

const { getColumnsByProjectName } = require('../data-access/project');
const { moveProjectCard, getProjectCardDetails } = require('../data-access/project-card');
const { moveZubeCard } = require('../data-access/zube');
const { addLoggingToRequest } = require('../logger');

module.exports = async function onCardCreated(context) {
  addLoggingToRequest(context);
  const {
    project_card: projectCardNode,
    repository: { node_id: repoId },
  } = context.payload;

  const projectCardDetails = await getProjectCardDetails(context, projectCardNode.node_id);

  if (projectCardDetails) {
    // get the column & issue from event's project card
    const { column, issue } = projectCardDetails;
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
      return;
    }
    // no Zube label means card was created in GitHub. Move Zube card from triage or other workspace
    return moveZubeCard(context, projectCardDetails);
  }
};
