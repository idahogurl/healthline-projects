/* eslint-env jest */
// eslint-disable-next-line import/no-extraneous-dependencies
const { Response, Headers } = jest.requireActual('node-fetch');
const { cloneDeep } = require('lodash');

const projectColumns = require('../test/fixtures/github/project-columns.json');
const issue = require('../test/fixtures/github/issue.json');
const issueDiffProject = require('../test/fixtures/github/issue-diff-project.json');
const issueNoZubeLabel = require('../test/fixtures/github/issue-no-zube.json');
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

const noProjectColumns = cloneDeep(projectColumns);
noProjectColumns.data.node.id = 2;
noProjectColumns.data.node.projects.nodes = [];

const issueNoMatchingProject = cloneDeep(issueDiffProject);
issueNoMatchingProject.data.node.projectCards.nodes[0].project.name = 'Team Avengers';
issueNoMatchingProject.data.node.issue.number = 9210;

const fixtures = {
  'query getProjectColumns': {
    1: projectColumns,
    2: noProjectColumns,
    // 3: noMatchingProjectColumns,
  },
  'query getProjectCardDetails': {
    1: issue,
    2: issueNoZubeLabel,
    3: issueLabelNotFound,
    4: issueFromCardSameLabel,
    5: issueFromCardDiffLabel,
    6: pullRequestMoved,
  },
  'query getProjectFromIssue': {
    1: issue,
    2: issueNoCards,
    3: issueDiffProject,
    4: issueNoMatchingProject,
  },
  'query getProjectCardFromIssue': {
    1: issue,
    2: issueNoCards,
    3: issueDiffProject,
    4: issueNoMatchingProject,
    5: issueFromCardSameLabel,
    6: issueFromCardDiffLabel,
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
