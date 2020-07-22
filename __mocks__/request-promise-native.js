/* eslint-env jest */
const zubeCard = require('../test/fixtures/zube/card.json');
const noWorkspace = require('../test/fixtures/zube/no-workspace.json');
const sameLabel = require('../test/fixtures/zube/same-label.json');
const noMatchingColumn = require('../test/fixtures/zube/no-matching-column.json');

const fixtures = {
  'https://zube.io/api/projects/16987/cards': {
    zubeCard,
    qs: {
      'mnt program': zubeCard,
      'not found': { statusCode: 404, data: [] },
      'send gam': noWorkspace,
      'create ab': sameLabel,
      'swap swoop': noMatchingColumn,
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
