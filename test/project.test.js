/* eslint-env jest, node */
const project = require('../data-access/project');
const { mockContext } = require('./utils');

describe('getColumnsByProjectName', () => {
  test('no columns returned', async () => {
    const context = mockContext();
    const columns = await project.getColumnsByProjectName({
      context,
      repoId: 2,
      projectName: 'Team Rocket',
    });
    expect(columns.length).toBe(0);
  });
});
