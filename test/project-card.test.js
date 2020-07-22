/* eslint-env jest, node */
const projectCard = require('../data-access/project-card');
const { mockContext } = require('./utils');
const projectCardMoved = require('./fixtures/github/project-card-moved.json');
const projectColumns = require('./fixtures/github/project-columns.json');

describe('addProjectCard', () => {
  test('has Zube card without a workspace', async () => {
    const context = mockContext({ payload: { issue: {}, repository: { node_id: 1 } } });
    const didAdd = await projectCard.addProjectCard({
      context,
    });
    expect(didAdd).toBeUndefined();
  });

  test('no matching column', async () => {
    const context = mockContext({ payload: { issue: {}, repository: { node_id: 1 } } });
    const didAdd = await projectCard.addProjectCard({
      context,
      zubeWorkspace: { name: 'Team Rocket' },
      zubeCategory: 'Small',
    });
    expect(didAdd).toBeUndefined();
  });
});

describe('getMatchingColumn', () => {
  const context = mockContext({ payload: projectCardMoved });

  const [project] = projectColumns.data.node.projects.nodes;
  const projectCardNode = {
    node_id: '',
    column: { name: 'Next', project: { columns: project.columns } },
  };

  test('same label', async () => {
    const newColumn = '[zube]: Next';

    const didMove = await projectCard.moveProjectCard({
      context,
      projectCardNode,
      newColumn,
      projectColumns,
    });
    expect(didMove).toBeUndefined();
  });

  test('no match', async () => {
    const newColumn = '[zube]: Small';

    const didMove = await projectCard.moveProjectCard({
      context,
      projectCardNode,
      newColumn,
      projectColumns,
    });
    expect(didMove).toBeUndefined();
  });
});
