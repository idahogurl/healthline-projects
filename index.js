const initRollbar = require('./rollbar');
const { getAccessJwt, zubeRequest } = require('./zube');
const { ADD_PROJECT_CARD, MOVE_PROJECT_CARD, GET_PROJECT_CARD } = require('./graphql/project-card');
const { GET_PROJECT_FROM_ISSUE, GET_PROJECT_COLUMNS } = require('./graphql/project');

require('dotenv').config();

const rollbar = initRollbar();

function onError(e, context) {
  if (process.env.NODE_ENV === 'prod') {
    rollbar.error(e, context.payload, { level: 'info' });
  } else {
    console.error(e, context.payload);
  }
  throw e;
}

function logInfo(s) {
  if (process.env.NODE_ENV === 'prod') {
    rollbar.info(s);
  } else {
    console.log(s);
  }
}
async function getZubeCard(context, accessJwt) {
  const {
    issue: { title, number },
  } = context.payload;

  // find the Zube card
  const search = title.split(' ').slice(0, 5).join(' ');
  // get first 5 words to speed up request
  const { data } = await zubeRequest({
    endpoint: `projects/${process.env.ZUBE_PROJECT_ID}/cards?search=${search}`,
    accessJwt,
  });

  // find issue in Zube cards
  const zubeCard = data
    .filter((d) => d.github_issue !== null)
    .find((d) => d.github_issue.number === number);

  return zubeCard;
}

async function addCard(context) {
  const {
    issue: { node_id: issueId, number },
    repository,
  } = context.payload;

  const accessJwt = await getAccessJwt();

  const zubeCard = await getZubeCard(context, accessJwt);

  if (zubeCard) {
    const { workspace_id: wordspaceId, category_name: category, priority } = zubeCard;

    // get Zube workspace details
    const workspace = await zubeRequest({
      endpoint: `workspaces/${wordspaceId}`,
      accessJwt,
    });

    const {
      node_id: repoId,
      name: repo,
      owner: { login },
    } = repository;

    // find project matching Zube workspace
    const { node: repoNode } = await context.github.graphql(GET_PROJECT_COLUMNS, {
      id: repoId,
      project: workspace.name,
    });

    const [projectNode] = repoNode.projects.nodes;
    const { nodes: columns } = projectNode.columns;
    // get column matching Zube category
    const searchCategory = category.toLowerCase();
    const column = columns.find((c) => c.name.toLowerCase() === searchCategory);
    if (column) {
      // add project card to that matching column from matching project
      context.github.graphql(ADD_PROJECT_CARD, {
        input: {
          projectColumnId: column.id,
          contentId: issueId,
        },
      });

      // add priority label
      if (priority) {
        await context.github.issues.addLabel({
          owner: login,
          repo,
          issue_number: number,
          labels: `P${priority}`,
        });
      }
    } else {
      logInfo(`Could not match '${searchCategory}' to GitHub project column`);
    }
  } else {
    logInfo(`GitHub issue #${number} could not be found in Zube`);
  }
}

async function getIssueFromCard(context) {
  const { project_card: projectCardNode } = context.payload;
  // get column of project card
  const { node: projectCard } = await context.github.graphql(GET_PROJECT_CARD, {
    id: projectCardNode.node_id,
  });
  // get the column & issue from event's project card
  const { column, content: issue } = projectCard;

  // pull request being added to project do not have an issue
  if (issue.id) {
    return { issue, column };
  }
}

async function addLabel(context) {
  const { repository } = context.payload;

  const {
    name: repo,
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

  // "Add to Source" opens the card and then labels it
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
        // issue may not be assigned to a project
        if (cardNode) {
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
              return context.github.graphql(MOVE_PROJECT_CARD, {
                input: {
                  cardId,
                  columnId: matchingColumn.id,
                },
              });
            }
          }
        } else {
          await addCard(context);
        }
      }
    } catch (e) {
      onError(e, context);
    }
  });

  app.on('project_card.created', async (context) => {
    try {
      const result = await getIssueFromCard(context);
      if (result) {
        const { issue } = result;
        const {
          labels: { nodes: labels },
        } = issue;
        const currentLabel = labels.find((l) => l.name.includes('[zube]'));
        if (currentLabel) {
          // already has a Zube label, do nothing
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
          }
        }
      }
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
