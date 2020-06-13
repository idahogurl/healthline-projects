// const issueCreatedBody = { body: 'Thanks for opening this issue!' };
/* eslint-env jest, node */
const nock = require('nock');
const { Probot, GitHubAPI } = require('probot');
const fs = require('fs');
const path = require('path');

// Requiring our app implementation
const myProbotApp = require('..');
// Requiring our fixtures
const payload = require('./fixtures/github/issues.opened');

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

  test('issues.opened', async () => {
    await probot.receive({ name: 'issues', payload });
  });

  test('issues.labeled', async () => {
    await probot.receive({ name: 'issues', payload });
  });

  test('project_card.created', async () => {
    await probot.receive({ name: 'project_card', payload });
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
