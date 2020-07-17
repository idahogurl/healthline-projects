/* eslint-env jest */
const zubeCard = require('../test/fixtures/zube/card.json');

const fixtures = {
  'https://zube.io/api/projects/16987/cards': {
    zubeCard,
    qs: {
      'mnt program': zubeCard,
      'not found': { statusCode: 404, data: [] },
    },
  },
  'https://zube.io/api/users/tokens': { statusCode: 200, access_token: 'test' },
  'https://zube.io/api/cards/5903798': { statusCode: 200 },
  'https://zube.io/api/cards/5903798/move': {},
};

module.exports = jest.fn().mockImplementation((uri, { qs }) => {
  if (qs) {
    const [value] = Object.values(qs);
    return Promise.resolve(fixtures[uri].qs[value]);
  }
  return Promise.resolve(fixtures[uri]);
});
