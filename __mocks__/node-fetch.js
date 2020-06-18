/* eslint-env jest */
// eslint-disable-next-line import/no-extraneous-dependencies
const { Response, Headers } = jest.requireActual('node-fetch');
const getProjectColumns = require('../test/fixtures/github/project-columns.json');
const getProjectCard = require('../test/fixtures/github/project-card.json');
const getProjectCardNoZube = require('../test/fixtures/github/project-card-no-zube.json');
const getProjectCardDiffZube = require('../test/fixtures/github/project-card-diff-zube.json');
const getProject = require('../test/fixtures/github/project.json');
const getProjectNoCards = require('../test/fixtures/github/project-no-cards.json');
const getLabel = require('../test/fixtures/github/label.json');

const fixtures = {
  'query getProjectColumns': getProjectColumns,
  'query getProjectCard': {
    1: getProjectCardNoZube,
    2: getProjectCard,
    3: getProjectCardDiffZube,
  },
  'query getProjectFromIssue': {
    1: getProject,
    2: getProjectNoCards,
  },
  'query getLabel': getLabel,
  'mutation moveProjectCard': {
    clientMutationId: '12345',
  },
  'mutation removeLabel': {
    clientMutationId: '12345',
  },
  'mutation addLabel': {
    clientMutationId: '12345',
  },
};

module.exports = {
  default: jest.fn((_, requestOptions) => {
    let response;
    const body = JSON.parse(requestOptions.body);
    const fixture = Object.keys(fixtures).find((f) => body.query.includes(f));
    response = fixtures[fixture];

    if (body.variables.id) {
      if (response[body.variables.id]) {
        response = response[body.variables.id];
      }
    }
    if (!response) response = {};
    return Promise.resolve(
      new Response(JSON.stringify(response), {
        headers: new Headers({ 'Content-Type': 'application/json' }),
      }),
    );
  }),
};
