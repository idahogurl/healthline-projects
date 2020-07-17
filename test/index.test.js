/* eslint-env jest, node */
const { Probot } = require('probot');
const fs = require('fs');
const path = require('path');
const zube = require('../data-access/zube');
const projectCard = require('../data-access/project-card');

jest.mock('../data-access/zube');
jest.mock('../data-access/project-card');

require('dotenv').config();
// Requiring our app implementation
const myProbotApp = require('..');
// Requiring our fixtures
const projectCardCreated = require('./fixtures/github/project-card-created.json');
const projectCardMoved = require('./fixtures/github/project-card-moved.json');
const issuesLabeled = require('./fixtures/github/issues-labeled.json');
const issuesOpened = require('./fixtures/github/issues-opened.json');
const { spyOnObject } = require('./utils');

jest.setTimeout(20000); // 1 second

describe('My Probot app', () => {
  let probot;
  let mockCert;

  beforeAll((done) => {
    spyOnObject('../data-access/zube', zube);
    spyOnObject('../data-access/project-card', projectCard);
    fs.readFile(path.join(__dirname, 'fixtures/mock-cert.pem'), (err, cert) => {
      if (err) return done(err);
      mockCert = cert;
      done();
    });
  });

  beforeEach(() => {
    probot = new Probot({ id: 123, cert: mockCert });
    // Load our app into probot
    probot.load(myProbotApp);
  });

  test('issue.opened with Zube card', async () => {
    const openedIssue = { ...issuesOpened, issue: { ...issuesOpened.issue } };
    openedIssue.issue.node_id = 2;
    await probot.receive({ name: 'issues', payload: openedIssue });
    expect(projectCard.addProjectCard).toHaveBeenCalled();
  });

  test('issue.opened without Zube card', async () => {
    const openedIssue = { ...issuesOpened, issue: { ...issuesOpened.issue } };
    openedIssue.issue.title = 'Not found';
    await probot.receive({ name: 'issues', payload: openedIssue });
    expect(projectCard.addProjectCard).toHaveBeenCalledTimes(0);
  });

  describe('issues.labeled', () => {
    test('with project cards', async () => {
      const labeledIssue = { ...issuesLabeled, issue: { ...issuesLabeled.issue } };
      labeledIssue.issue.node_id = 1;
      await probot.receive({ name: 'issues', payload: labeledIssue });
      expect(projectCard.moveProjectCard).toHaveBeenCalled();
    });

    test('with no project cards', async () => {
      const labeledIssue = { ...issuesLabeled, issue: { ...issuesLabeled.issue } };
      labeledIssue.issue.node_id = 2;
      await probot.receive({ name: 'issues', payload: labeledIssue });
      expect(projectCard.addProjectCard).toHaveBeenCalled();
    });

    test('with different project', async () => {
      const labeledIssue = { ...issuesLabeled, issue: { ...issuesLabeled.issue } };
      labeledIssue.issue.node_id = 3;
      await probot.receive({ name: 'issues', payload: labeledIssue });
      expect(projectCard.deleteProjectCard).toHaveBeenCalled();
      expect(projectCard.addProjectCard).toHaveBeenCalled();
    });

    test('labeled with priority label', async () => {
      const labeledIssuePriority = { ...issuesLabeled, label: { name: 'P5' } };
      await probot.receive({ name: 'issues', payload: labeledIssuePriority });
      expect(zube.updatePriority).toHaveBeenCalled();
    });
  });

  describe('issues.unlabeled', () => {
    test('with project cards', async () => {
      const unlabeledIssue = { ...issuesLabeled, issue: { ...issuesLabeled.issue } };
      unlabeledIssue.action = 'unlabeled';
      unlabeledIssue.issue.node_id = 1;
      await probot.receive({ name: 'issues', payload: unlabeledIssue });
      expect(projectCard.moveProjectCard).toHaveBeenCalled();
    });

    test('with no project cards', async () => {
      const unlabeledIssue = { ...issuesLabeled, issue: { ...issuesLabeled.issue } };
      unlabeledIssue.action = 'unlabeled';
      unlabeledIssue.issue.node_id = 2;
      await probot.receive({ name: 'issues', payload: unlabeledIssue });
      expect(projectCard.addProjectCard).toHaveBeenCalled();
    });

    test('with different project', async () => {
      const unlabeledIssue = { ...issuesLabeled, issue: { ...issuesLabeled.issue } };
      unlabeledIssue.action = 'unlabeled';
      unlabeledIssue.issue.node_id = 3;
      await probot.receive({ name: 'issues', payload: unlabeledIssue });
      expect(projectCard.deleteProjectCard).toHaveBeenCalled();
      expect(projectCard.addProjectCard).toHaveBeenCalled();
    });
  });

  describe('project_card.created', () => {
    test('with no Zube label', async () => {
      const createdProjectCard = { ...projectCardCreated, issue: { ...projectCardCreated.issue } };
      createdProjectCard.project_card.node_id = 2;
      await probot.receive({ name: 'project_card', payload: createdProjectCard });
      expect(zube.moveZubeCard).toHaveBeenCalled();
    });

    test('has same Zube label', async () => {
      const createdProjectCard = { ...projectCardCreated, issue: { ...projectCardCreated.issue } };
      createdProjectCard.project_card.node_id = 2;
      await probot.receive({ name: 'project_card', payload: createdProjectCard });
      expect(projectCard.moveProjectCard).toHaveBeenCalledTimes(0);
    });

    test('has different Zube label', async () => {
      const createdProjectCard = { ...projectCardCreated, issue: { ...projectCardCreated.issue } };
      createdProjectCard.project_card.node_id = 3;
      // Zube label different than column
      await probot.receive({ name: 'project_card', payload: createdProjectCard });
      expect(projectCard.moveProjectCard).toHaveBeenCalledTimes(0);
    });
  });

  describe('project_card.moved', () => {
    test('with label not found', async () => {
      const movedProjectCard = {
        ...projectCardMoved,
        project_card: { ...projectCardMoved.project_card },
      };
      movedProjectCard.project_card.node_id = 3;
      await probot.receive({ name: 'project_card', payload: movedProjectCard });
    });

    test('with same label', async () => {
      const movedProjectCard = {
        ...projectCardMoved,
        project_card: { ...projectCardMoved.project_card },
      };
      movedProjectCard.project_card.node_id = 4;
      await probot.receive({ name: 'project_card', payload: movedProjectCard });
    });

    test('with different label', async () => {
      const movedProjectCard = { ...projectCardMoved };
      movedProjectCard.project_card.node_id = 5;
      await probot.receive({ name: 'project_card', payload: movedProjectCard });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});

// For more information about testing with Jest see:
// https://facebook.github.io/jest/

// For more information about testing with Nock see:
// https://github.com/nock/nock
