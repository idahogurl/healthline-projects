/*
USE CASE:
When a user clicks 'Add to Source' Zube will:
1. Create GitHub issue
2. Add Zube label to GitHub issue (fires issue.labeled event)

HANDLER LOGIC
1. Check if Zube label
2. Query for issue's project cards
3. If no project card
  a. Create project card

  ELSE

  a. Does it already have a Zube label?
  b. Does it already have the same Zube label
      Do nothing
        ELSE
      Move to GitHub project column matching Zube label

USE CASE
When a user moves card in Zube:
1. Adds Zube label to GitHub issue (fires issue.labeled event)
*/
const { getAccessJwt, zubeRequest } = require('./zube');
const {
  getZubeCard, getColumnsByProjectName, moveProjectCard, findLabel,
} = require('./shared');
const { logInfo } = require('./error-handler');
const { ADD_PROJECT_CARD } = require('./graphql/project-card');
const { GET_PROJECT_FROM_ISSUE } = require('./graphql/project');
const { ADD_LABEL } = require('./graphql/label');

async function assignPriority(context, priority) {
  const {
    issue: { node_id: issueId },
  } = context.payload;

  const search = `P${priority}`;
  const label = await findLabel(context, search);
  if (label) {
    await context.github.graphql(ADD_LABEL, {
      labelableId: issueId,
      labelIds: [label.id],
    });
  } else {
    logInfo(`Could not find '${search}' in GitHub labels`);
  }
}

async function addCard(context) {
  const {
    issue: { node_id: issueId, number },
    repository,
  } = context.payload;

  const { node_id: repoId } = repository;

  const accessJwt = await getAccessJwt();
  const zubeCard = await getZubeCard(context, accessJwt);
  if (zubeCard) {
    const { workspace_id: workspaceId, category_name: category, priority } = zubeCard;

    const workspace = await zubeRequest({
      endpoint: `workspaces/${workspaceId}`,
      accessJwt,
    });

    const { nodes: columns } = await getColumnsByProjectName({
      context,
      repoId,
      projectName: workspace.name,
    });
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

      if (priority !== null) {
        await assignPriority(context, priority);
      }
    } else {
      logInfo(`Could not match '${searchCategory}' to GitHub project column`);
    }
  } else {
    logInfo(`GitHub issue #${number} could not be found in Zube`);
  }
}

module.exports = async function onIssueLabeled(context) {
  const {
    label: addedLabel,
    issue: { node_id: issueId, number },
  } = context.payload;

  // Zube label?
  if (addedLabel.name.includes('[zube]')) {
    const { node } = await context.github.graphql(GET_PROJECT_FROM_ISSUE, {
      id: issueId,
    });

    const { nodes: projectCards } = node.projectCards;
    const [projectCardNode] = projectCards;

    if (projectCardNode) {
      await moveProjectCard({
        context,
        projectCardNode,
        newColumn: addedLabel.name,
      });
    } else {
      await addCard(context);
    }
  }

  // priority label?
  if (/^P\d$/.test(addedLabel.name)) {
    const accessJwt = await getAccessJwt();
    const zubeCard = await getZubeCard(context, accessJwt);
    const priority = parseInt(addedLabel.name.replace('P', ''), 10);
    if (zubeCard) {
      if (zubeCard.priority !== priority) {
        await zubeRequest({
          endpoint: `cards/${zubeCard.id}`,
          accessJwt,
          body: {
            ...zubeCard,
            priority,
          },
          method: 'PUT',
        });
      }
    } else {
      logInfo(`GitHub issue #${number} could not be found in Zube`);
    }
  }
};
