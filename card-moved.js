const { getIssueFromCard } = require('./shared');
const { GET_LABEL, REMOVE_LABEL, ADD_LABEL } = require('./graphql/label');

module.exports = async function addLabel(context) {
  const { repository } = context.payload;

  const {
    name: repoName,
    owner: { login },
  } = repository;

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
      // get the matching label
      const {
        repository: {
          labels: { nodes: labelNodes },
        },
      } = await context.github.graphql(GET_LABEL, {
        name: repoName,
        owner: login,
        search: `[zube]: ${columnName}`,
      });
      const [label] = labelNodes;
      // make sure GitHub returns the matching label. It returns
      // the '[zube]: Inbox' label if the new label cannot be found
      if (label.name.toLowerCase() === newLabel) {
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
