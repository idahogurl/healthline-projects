/* eslint-env jest */
// eslint-disable-next-line import/no-extraneous-dependencies
const { Response, Headers } = jest.requireActual('node-fetch');
const getProjectColumns = require('../test/fixtures/github/project.columns.json');
const getProjectCard = require('../test/fixtures/github/project.card.json');
const getProjectCardNoZube = require('../test/fixtures/github/project.card.no.zube.json');
const getProject = require('../test/fixtures/github/project.json');
const moveProjectCard = require('../test/fixtures/github/move.project.card.json');

const fixtures = {
  'query getProjectColumns($id: ID!, $project: String!)': getProjectColumns,
  'query getProjectCard($id: ID!)': {
    1: getProjectCardNoZube,
    2: getProjectCard,
  },
  'query getProjectFromIssue($id: ID!)': getProject,
  'mutation moveProjectCard($input: MoveProjectCardInput!)': moveProjectCard,
};

module.exports = {
  default: jest.fn((_, requestOptions) => {
    const body = JSON.parse(requestOptions.body);
    const fixture = Object.keys(fixtures).find((f) => body.query.includes(f));
    let response = fixtures[fixture];

    if (body.variables.id) {
      if (response[body.variables.id]) {
        response = response[body.variables.id];
      }
    }
    // look at query parameters
    return Promise.resolve(
      new Response(JSON.stringify(response), {
        headers: new Headers({ 'Content-Type': 'application/json' }),
      }),
    );
  }),
};
