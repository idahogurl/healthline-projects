/* eslint-env jest */
const zubeCard = require('../test/fixtures/zube/card.json');
const zubeWorkspace = require('../test/fixtures/zube/workspace.json');
const zubeWorkspaceName = require('../test/fixtures/zube/workspace-name.json');

const fixtures = {
  'https://zube.io/api/projects/16987/cards?search=mnt%20program': zubeCard,
  'https://zube.io/api/workspaces/23683': zubeWorkspace,
  'https://zube.io/api/users/tokens': { statusCode: 200, access_token: 'test' },
  'https://zube.io/api/workspaces?where%5Bname%5D=Team%20Board': zubeWorkspaceName,
  'https://zube.io/api/cards/5903798/move': {},
};

module.exports = jest.fn().mockImplementation((uri) => Promise.resolve(fixtures[uri]));
