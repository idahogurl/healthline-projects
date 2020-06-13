/* eslint-env jest */
// eslint-disable-next-line import/no-extraneous-dependencies
const { Response, Headers } = jest.requireActual('node-fetch');
const getProjectColumns = require('../test/fixtures/github/project.columns.json');
const getProjectCard = require('../test/fixtures/github/project.card.json');

const fixtures = {
  'query getProjectColumns($id: ID!, $project: String!)': getProjectColumns,
  'query getProjectCard($id: ID!)': getProjectCard,
};

module.exports = {
  default: jest.fn((_, requestOptions) => {
    const { body: query } = requestOptions;
    const fixture = Object.keys(fixtures).find((f) => query.includes(f));

    return Promise.resolve(
      new Response(JSON.stringify(fixtures[fixture]), {
        headers: new Headers({ 'Content-Type': 'application/json' }),
      }),
    );
  }),
};
