/* eslint-env jest, node */
const nock = require('nock');
const { Probot } = require('probot');
const fs = require('fs');
const path = require('path');
const shared = require('../shared');
const projectCard = require('../project-card');

jest.mock('../shared');
jest.mock('../project-card');

function spyOnObject(fileName, module) {
  const actual = jest.requireActual(fileName);

  const functions = Object.keys(module);
  functions.forEach((f) => {
    module[f].mockImplementation(async (...args) => actual[f].apply(null, args));
  });
}

// Requiring our app implementation
const myProbotApp = require('..');
// Requiring our fixtures
const projectCardCreated = require('./fixtures/github/project-card-created.json');
const projectCardMoved = require('./fixtures/github/project-card-moved.json');
const issuesLabeled = require('./fixtures/github/issues-labeled.json');
const issuesOpened = require('./fixtures/github/issues-labeled.json');

jest.setTimeout(20000); // 1 second

describe('My Probot app', () => {
  let probot;
  let mockCert;

  beforeAll((done) => {
    spyOnObject('../shared', shared);
    spyOnObject('../project-card', projectCard);
    fs.readFile(path.join(__dirname, 'fixtures/mock-cert.pem'), (err, cert) => {
      if (err) return done(err);
      mockCert = cert;
      done();
    });
  });

  beforeEach(() => {
    nock.disableNetConnect();
    probot = new Probot({ id: 123, cert: mockCert });
    // Load our app into probot
    probot.load(myProbotApp);
  });

  test('issue.opened', async () => {
    issuesOpened.issue.node_id = 2;
    await probot.receive({ name: 'issues', payload: issuesOpened });
  });

  test('issues.labeled with project cards', async () => {
    issuesLabeled.issue.node_id = 1;
    await probot.receive({ name: 'issues', payload: issuesLabeled });
    expect(shared.getZubeCardDetails).toHaveBeenCalled();
  });

  test('issues.labeled diff project', async () => {
    issuesLabeled.issue.node_id = 3;
    await probot.receive({ name: 'issues', payload: issuesLabeled });
    expect(projectCard.deleteProjectCard).toHaveBeenCalled();
  });

  test('issues.unlabeled', async () => {});

  test('issues.labeled no project cards', async () => {
    issuesLabeled.issue.node_id = 2;
    await probot.receive({ name: 'issues', payload: issuesLabeled });
  });

  test('project_card.created no Zube label', async () => {
    projectCardCreated.project_card.node_id = 1;
    await probot.receive({ name: 'project_card', payload: projectCardCreated });
  });

  test('project_card.created has same Zube label', async () => {
    projectCardCreated.project_card.node_id = 2;
    await probot.receive({ name: 'project_card', payload: projectCardCreated });
  });

  test('project_card.created has different Zube label', async () => {
    projectCardCreated.project_card.node_id = 3;
    // Zube label different than column
    await probot.receive({ name: 'project_card', payload: projectCardCreated });
  });

  test('project_card.moved label not found', async () => {
    projectCardMoved.project_card.node_id = 3;
    await probot.receive({ name: 'project_card', payload: projectCardMoved });
  });

  test('project_card.moved same label', async () => {
    projectCardMoved.project_card.node_id = 4;
    await probot.receive({ name: 'project_card', payload: projectCardMoved });
  });

  test('project_card.moved different label', async () => {
    projectCardMoved.project_card.node_id = 5;
    await probot.receive({ name: 'project_card', payload: projectCardMoved });
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
    jest.clearAllMocks();
  });
});

// For more information about testing with Jest see:
// https://facebook.github.io/jest/

// For more information about testing with Nock see:
// https://github.com/nock/nock
