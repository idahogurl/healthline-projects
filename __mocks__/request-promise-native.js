/* eslint-env jest */
const zubeCard = require('../test/fixtures/zube/card.json');
const zubeWorkspace = require('../test/fixtures/zube/workspace.json');
const zubeUserToken = require('../test/fixtures/zube/user.token.json');

const fixtures = {
  'https://zube.io/api/projects/16987/cards?search=MNT%20program%20pages%20show%20%22Healthline%22': zubeCard,
  'https://zube.io/api/workspaces/23683': zubeWorkspace,
  'https://zube.io/api/users/tokens': zubeUserToken,
};

// const rpn = jest.mock('request-promise-native');
// request = jest.fn((uri) => Promise.resolve(fixtures[uri]));

module.exports = jest.fn().mockImplementation((uri) => Promise.resolve(fixtures[uri]));
