// const { v4: uuidv4 } = require("uuid");

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

const GET_LABEL = `
query getLabel($name: String!, $owner: String!, $search: String!) {
  repository(name: $name, owner: $owner) {
    labels(query: $search, first: 1) {
      nodes {
        id
        name
      }
    }
  }
}
`;

const REMOVE_LABEL = `
mutation removeLabel($labelableId: ID!, $labelIds: [ID!]!) {
  removeLabelsFromLabelable(input: { labelableId: $labelableId, labelIds: $labelIds }) {
      clientMutationId
  }
}
`;

const ADD_LABEL = `
mutation addLabel($labelableId: ID!, $labelIds: [ID!]!) {
  addLabelsToLabelable(input: { labelableId: $labelableId, labelIds: $labelIds }) {
    clientMutationId
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

async function addLabel(context) {
  const { project_card: projectCardNode, repository } = context.payload;

  const {
    name: repoName,
    owner: { login },
  } = repository;

  // get column of project card
  const { node: projectCard } = await context.github.graphql(
    GET_PROJECT_CARD_INFO,
    {
      id: projectCardNode.node_id,
    }
  );

  // get the column & issue from event's project card
  const {
    column: { name: columnName },
    content: issue,
  } = projectCard;

  // issue comes back as an empty object if it is a pull request being added to project
  if (issue.id) {
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

    const { nodes: labels } = issue.labels;

    // find Zube label in issue's assigned labels
    const zubeLabel = labels.find((l) => l.name.includes("[zube]"));
    const [label] = labelNodes;

    if (zubeLabel) {
      if (label && label.id === zubeLabel.id) {
        // issue already has label assigned
      } else {
        await context.github.graphql(REMOVE_LABEL, {
          labelableId: issue.id,
          labelIds: [zubeLabel.id],
        });
      }
    }

    if (label) {
      if (zubeLabel && zubeLabel.id === label.id) {
        // issue already has label assigned
      } else {
        await context.github.graphql(ADD_LABEL, {
          labelableId: issue.id,
          labelIds: [label.id],
        });
      }
    }
  }
}

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = (app) => {
  app.log("Yay, the app was loaded!");

  app.on("issues.labeled", async (context) => {
    const {
      label,
      issue: { node_id: issueId },
    } = context.payload;
    // when a label is added see if it's a Zube one
    if (label.name.includes("[zube]")) {
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
      const columnName = label.name.toLowerCase().replace("[zube]: ", "");
      const matchingColumn = columns.find(
        (c) => c.name.toLowerCase() === columnName
      );

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
  });

  app.on("project_card.created", async (context) => {
    return addLabel(context);
  });

  app.on("project_card.moved", async (context) => {
    return addLabel(context);
  });
};

// For more information on building apps:
// https://probot.github.io/docs/

// To get your app running against GitHub, see:
// https://probot.github.io/docs/development/
