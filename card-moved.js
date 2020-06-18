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
    const newLabel = `[zube]: ${columnName}`;
    const currentLabel = labels.find((l) => l.name.includes('[zube]'));
    if (currentLabel && currentLabel.name === newLabel) {
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

      if (currentLabel) {
        await context.github.graphql(REMOVE_LABEL, {
          labelableId: issue.id,
          labelIds: [currentLabel.id],
        });
      }

      const [label] = labelNodes;
      await context.github.graphql(ADD_LABEL, {
        labelableId: issue.id,
        labelIds: [label.id],
      });
    }
  }
};
