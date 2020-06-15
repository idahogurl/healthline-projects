// const issueCreatedBody = { body: 'Thanks for opening this issue!' };
/* eslint-env jest, node */
const nock = require('nock');
const { Probot } = require('probot');
const fs = require('fs');
const path = require('path');

// Requiring our app implementation
const myProbotApp = require('..');
// Requiring our fixtures
const projectCardCreated = require('./fixtures/github/project_card.created.json');
const projectCardMoved = require('./fixtures/github/project_card.moved.json');
const issuesLabeled = require('./fixtures/github/issues.labeled.json');

describe('My Probot app', () => {
  let probot;
  let mockCert;

  beforeAll((done) => {
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

  test('issues.labeled', async () => {
    issuesLabeled.issue.node_id = 1;
    await probot.receive({ name: 'issues', payload: issuesLabeled });
  });

  test('issues.labeled no project cards', async () => {
    issuesLabeled.issue.node_id = 2;
    await probot.receive({ name: 'issues', payload: issuesLabeled });
  });

  test('project_card.created no Zube label', async () => {
    projectCardCreated.project_card.node_id = 1;
    await probot.receive({ name: 'project_card', payload: projectCardCreated });
  });

  test('project_card.created has Zube label', async () => {
    projectCardCreated.project_card.node_id = 2;
    await probot.receive({ name: 'project_card', payload: projectCardCreated });
  });

  test('project_card.moved', async () => {
    projectCardMoved.project_card.node_id = 2;
    await probot.receive({ name: 'project_card', payload: projectCardMoved });
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});

// For more information about testing with Jest see:
// https://facebook.github.io/jest/

// For more information about testing with Nock see:
// https://github.com/nock/nock
