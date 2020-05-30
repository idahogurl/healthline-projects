const GET_PROJECT_CARDS = `
query getProjectCards($id: ID!) { 
  node(id: $id) {
    id
    ... on ProjectCard {
      column {
        id,
        name
      }
      content {
        ... on Issue {
          projectCards(first: 20) {
            nodes {
              id
              ... on ProjectCard {
                column {
                  id,
                  name
                }
                project {
                  id
                  columns(first:20) {
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

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = (app) => {
  app.log("Yay, the app was loaded!");

  app.on("project_card.moved", async (context) => {
    const { node: projectCard } = await context.github.graphql(
      GET_PROJECT_CARDS,
      {
        id: context.payload.project_card.node_id,
      }
    );

    // get the column & issue from event's project card
    const {
      column: { name: columnName },
      content: issue,
    } = projectCard;
    // get that issue's project cards
    const { nodes: projectCards } = issue.projectCards;
    const promises = projectCards
      .filter((card) => card.id !== projectCard.id)
      .map((card) => {
        // don't move if card's column name matches event card's column name
        if (card.column && card.column.name !== columnName) {
          // get the columns of the card's project
          const { nodes: columns } = card.project.columns;
          const matchingColumn = columns.find((col) => col.name === columnName);

          if (matchingColumn) {
            // assign that column to the project card
            return context.github.graphql(SET_COLUMN, {
              input: {
                cardId: card.id,
                columnId: matchingColumn.id,
              },
            });
          }
          return Promise.resolve();
        }
        return Promise.resolve();
      });
    return Promise.all(promises);
  });

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
