/* eslint-env jest */
const { cloneDeep } = require('lodash');
const zubeCard = require('../test/fixtures/zube/card.json');

const noWorkspace = cloneDeep(zubeCard);
noWorkspace.data[0].workspace_id = null;

const sameLabel = cloneDeep(zubeCard);
sameLabel.data[0].category_name = 'In Progress';

const noMatchingColumn = cloneDeep(zubeCard);
noMatchingColumn.data[0].workspace_id = 23682;

const fixtures = {
  'https://zube.io/api/projects/16987/cards': {
    zubeCard,
    qs: {
      'mnt program': zubeCard,
      'not found': { statusCode: 404, data: [] },
      'send gam': noWorkspace,
      'create ab': sameLabel,
      'swoop ads': noMatchingColumn,
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
