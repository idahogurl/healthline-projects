/* eslint-env jest */
const zubeCard = require('../test/fixtures/zube/card.json');

const fixtures = {
  'https://zube.io/api/projects/16987/cards': zubeCard,
  'https://zube.io/api/users/tokens': { statusCode: 200, access_token: 'test' },
  'https://zube.io/api/cards/5903798/move': {},
};

module.exports = jest.fn().mockImplementation((uri) => Promise.resolve(fixtures[uri]));
