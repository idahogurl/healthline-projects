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
  getZubeCard,
  getColumnsByProjectName,
  moveProjectCard,
} = require('./shared');
const { getAccessJwt, zubeRequest } = require('./zube');

module.exports = async function onCardCreated(context) {
  const {
    project_card: projectCardNode,
    organization: { node_id: organizationId },
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
      const { nodes: columns } = await getColumnsByProjectName({
        context,
        organizationId,
        projectName: column.project.name,
      });
      // issue already has a Zube label, move to matching projects column
      await moveProjectCard({
        context,
        projectCardNode,
        newColumn: zubeLabel.name,
        projectColumns: columns,
      });
    } else {
      const accessJwt = await getAccessJwt();
      // card created in GitHub, move Zube ticket from triage to matching board & category
      const zubeCard = await getZubeCard({ payload: { issue } }, accessJwt);
      const {
        name: columnName,
        project: { name: projectName },
      } = result.column;
      // find workspace matching card column
      const { data } = await zubeRequest({
        endpoint: `workspaces?where[name]=${projectName}`,
        accessJwt,
      });
      const [workspace] = data;
      if (workspace) {
        await zubeRequest({
          endpoint: `cards/${zubeCard.id}/move`,
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

        // add a label?
        // Not sure if Zube does this for you
      }
    }
  }
};
