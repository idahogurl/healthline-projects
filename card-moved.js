const { getIssueFromCard, findLabel } = require('./shared');
const { REMOVE_LABEL, ADD_LABEL } = require('./graphql/label');

module.exports = async function addLabel(context) {
  const result = await getIssueFromCard(context);
  if (result) {
    const {
      issue,
      column: { name: columnName },
    } = result;
    const {
      labels: { nodes: labels },
    } = issue;
    // find Zube label in issue's assigned labels
    const newLabel = `[zube]: ${columnName}`.toLowerCase();
    const currentLabel = labels.find((l) => l.name.includes('[zube]'));

    if (currentLabel && currentLabel.name.toLowerCase() === newLabel) {
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
};
