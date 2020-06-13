/* eslint-env jest */
const zubeCard = require('../test/fixtures/zube/card.json');
const zubeWorkspace = require('../test/fixtures/zube/workspace.json');
const zubeUserToken = require('../test/fixtures/zube/user.token.json');
const zubeWorkspaceName = require('../test/fixtures/zube/workspace.name.json');

const fixtures = {
  'https://zube.io/api/projects/16987/cards?search=MNT%20program%20pages%20show%20%22Healthline%22': zubeCard,
  'https://zube.io/api/workspaces/23683': zubeWorkspace,
  'https://zube.io/api/users/tokens': zubeUserToken,
  'https://zube.io/api/workspaces?where%5Bname%5D=Team%20Board': zubeWorkspaceName,
};

module.exports = jest.fn().mockImplementation((uri) => {
  console.log(uri);
  return Promise.resolve(fixtures[uri]);
});
