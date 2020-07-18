/* eslint-env jest */
// eslint-disable-next-line import/no-extraneous-dependencies
const { Response, Headers } = jest.requireActual('node-fetch');
const { cloneDeep } = require('lodash');

const projectColumns = require('../test/fixtures/github/project-columns.json');
const issue = require('../test/fixtures/github/issue.json');
const issueDiffProject = require('../test/fixtures/github/issue-diff-project.json');
const issueNoZube = require('../test/fixtures/github/issue-no-zube.json');
const issueLabelNotFound = require('../test/fixtures/github/issue-label-not-found.json');
const issueNoCards = require('../test/fixtures/github/issue-no-cards.json');
const issueLabels = require('../test/fixtures/github/issue-labels.json');
const label = require('../test/fixtures/github/label.json');

const issueFromCardSameLabel = cloneDeep(issue);
issueFromCardSameLabel.data.node.column.name = 'In Progress';

const issueFromCardDiffLabel = cloneDeep(issue);
issueFromCardDiffLabel.data.node.column.name = 'Next';

const pullRequestMoved = cloneDeep(issue);
delete pullRequestMoved.data.node.issue;

const fixtures = {
  'query getProjectColumns': projectColumns,
  'query getProjectCardDetails': {
    1: issue,
    2: issueNoZube,
    3: issueLabelNotFound,
    4: issueFromCardSameLabel,
    5: issueFromCardDiffLabel,
    6: pullRequestMoved,
  },
  'query getProjectFromIssue': {
    1: issue,
    2: issueNoCards,
    3: issueDiffProject,
  },
  'query getProjectCardFromIssue': {
    1: issue,
    2: issueNoCards,
    3: issueDiffProject,
  },
  'query getIssueLabels': {
    1: issueLabels,
    2: issueLabels,
    3: issueLabels,
  },
  'query getLabel': label,
  'mutation moveProjectCard': {
    clientMutationId: '12345',
  },
  'mutation deleteProjectCard': {
    clientMutationId: '12345',
  },
  'mutation removeLabel': {
    clientMutationId: '12345',
  },
  'mutation addLabel': {
    clientMutationId: '12345',
  },
  'mutation addProjectCard': {
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
