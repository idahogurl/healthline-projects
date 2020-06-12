const rollbar = require('rollbar');
const { getAccessJwt, zubeRequest } = require('./zube');

const GET_PROJECT_CARD_INFO = `
query getCardInfo($id: ID!) {
  node(id: $id) {
    id
    ... on ProjectCard {
      column {
        id
        name
      }
      content {
        ... on Issue {
          id
          title
          labels(first: 10) {
            nodes {
              id
              name
            }
          }
        }
      }
    }
  }
}
`;

const GET_PROJECT_FROM_ISSUE = `
query getProjectFromIssue($id: ID!) {
  node(id: $id) {
    id
    ... on Issue {
      projectCards(first: 1) {
        nodes {
          id
          number
          column {
            id
            name
          }
          project {
            columns(first: 20) {
              nodes {
                id
                name
              }
            }
          }
        }
      }
    }
  }
}
`;

const SET_COLUMN = `
mutation setColumn($input: MoveProjectCardInput!) {
  moveProjectCard(input: $input) {
    clientMutationId
  }
}
`;

function onError(e, context) {
  rollbar.error(e, context, { level: 'info' });
  throw e;
}

async function addLabel(context) {
  const { project_card: projectCardNode, repository } = context.payload;

  const {
    name: repo,
    owner: { login },
  } = repository;

  // get column of project card
  const { node: projectCard } = await context.github.graphql(GET_PROJECT_CARD_INFO, {
    id: projectCardNode.node_id,
  });

  // get the column & issue from event's project card
  const {
    column: { name: columnName },
    content: issue,
  } = projectCard;

  // pull request being added to project do not have an issue
  if (issue.id) {
    const { nodes: labels } = issue.labels;

    // find Zube label in issue's assigned labels
    const newLabel = `[zube]: ${columnName}`;
    const currentLabel = labels.find((l) => l.name.includes('[zube]'));
    if (currentLabel && currentLabel.name === newLabel) {
      // do not remove since issue already has label assigned
    } else {
      // await context.github.issues.removeLabel({
      //   owner: login,
      //   repo,
      //   issue_number: issue.number,
      //   name: currentLabel.name,
      // });
      // await context.github.issues.addLabel({
      //   owner: login,
      //   repo,
      //   issue_number: issue.number,
      //   labels: newLabel,
      // });
      await context.github.issues.setLabels({
        owner: login,
        repo,
        issue_number: issue.number,
        labels: labels.map((l) => l.name),
      });
    }
  }
}

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = (app) => {
  app.log('Yay, the app was loaded!');

  app.on('issues.opened', async (context) => {
    const {
      issue: { node_id: issueId },
    } = context.payload;

    // find the Zube ticket
    const accessJwt = await getAccessJwt();
    zubeRequest({ endpoint: '', accessJwt });
    // get its category and workspace
    // create card for issue in the project and column matching Zube workspace & category
    // add priority label
  });

  app.on('issues.labeled', async (context) => {
    try {
      const {
        label,
        issue: { node_id: issueId },
      } = context.payload;
      // when a label is added see if it's a Zube one
      if (label.name.includes('[zube]')) {
        const { node } = await context.github.graphql(GET_PROJECT_FROM_ISSUE, {
          id: issueId,
        });

        const { nodes: projectCards } = node.projectCards;
        const [cardNode] = projectCards;

        const {
          id: cardId,
          column,
          project: {
            columns: { nodes: columns },
          },
        } = cardNode;
        const columnName = label.name.toLowerCase().replace('[zube]: ', '');
        const matchingColumn = columns.find((c) => c.name.toLowerCase() === columnName);

        if (matchingColumn) {
          if (column && column.id === matchingColumn.id) {
            // do not move if current column is already assigned to matching column
          } else {
            // move to column matching Zube label
            return context.github.graphql(SET_COLUMN, {
              input: {
                cardId,
                columnId: matchingColumn.id,
              },
            });
          }
        }
      }
    } catch (e) {
      onError(e, context);
    }
  });

  app.on('project_card.created', async (context) => {
    try {
      // add to corresponding Zube workspace
      return addLabel(context);
    } catch (e) {
      onError(e, context);
    }
  });

  app.on('project_card.moved', async (context) => {
    try {
      return addLabel(context);
    } catch (e) {
      onError(e, context);
    }
  });
};

// For more information on building apps:
// https://probot.github.io/docs/

// To get your app running against GitHub, see:
// https://probot.github.io/docs/development/
