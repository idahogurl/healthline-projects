/* eslint-env jest, node */
const { Probot } = require('probot');
const fs = require('fs');
const path = require('path');
const { cloneDeep } = require('lodash');

const zube = require('../data-access/zube');
const projectCard = require('../data-access/project-card');
const label = require('../data-access/label');

jest.mock('../data-access/zube');
jest.mock('../data-access/project-card');
jest.mock('../data-access/label');

require('dotenv').config();
// Requiring our app implementation
const myProbotApp = require('..');
// Requiring our fixtures
const projectCardCreated = require('./fixtures/github/events/project-card-created.json');
const projectCardMoved = require('./fixtures/github/events/project-card-moved.json');
const issuesLabeled = require('./fixtures/github/events/issues-labeled.json');
const issuesOpened = require('./fixtures/github/events/issues-opened.json');
const { spyOnObject } = require('./utils');

jest.setTimeout(20000); // 1 second

describe('My Probot app', () => {
  let probot;
  let mockCert;

  beforeAll((done) => {
    spyOnObject('../data-access/zube', zube);
    spyOnObject('../data-access/project-card', projectCard);
    spyOnObject('../data-access/label', label);

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

  describe('issues.opened', () => {
    test('with Zube card', async () => {
      const openedIssue = cloneDeep(issuesOpened);
      openedIssue.issue.node_id = 2;
      await probot.receive({ name: 'issues', payload: openedIssue });
      expect(projectCard.addProjectCard).toHaveBeenCalled();
    });

    test('without Zube card', async () => {
      const openedIssue = cloneDeep(issuesOpened);
      openedIssue.issue.title = 'Not found';
      await probot.receive({ name: 'issues', payload: openedIssue });
      expect(projectCard.addProjectCard).toHaveBeenCalledTimes(0);
    });

    test('no Zube workspace', async () => {
      const openedIssue = cloneDeep(issuesOpened);
      openedIssue.issue.title = 'Send GAM categories from article';
      openedIssue.issue.node_id = 1;

      await probot.receive({ name: 'issues', payload: openedIssue });
    });

    test('no matching column', async () => {
      const openedIssue = cloneDeep(issuesOpened);
      openedIssue.issue.title = 'Swap Swoop and INA ad positions';
      openedIssue.issue.node_id = 1;

      await probot.receive({ name: 'issues', payload: openedIssue });
    });
  });

  describe('issues.labeled', () => {
    test('with project cards', async () => {
      const labeledIssue = cloneDeep(issuesLabeled);
      labeledIssue.issue.node_id = 1;

      await probot.receive({ name: 'issues', payload: labeledIssue });
      expect(projectCard.moveProjectCard).toHaveBeenCalled();
    });

    test('with no project cards', async () => {
      const labeledIssue = cloneDeep(issuesLabeled);
      labeledIssue.issue.node_id = 2;

      await probot.receive({ name: 'issues', payload: labeledIssue });
      expect(projectCard.addProjectCard).toHaveBeenCalled();
    });

    test('with different project', async () => {
      const labeledIssue = cloneDeep(issuesLabeled);
      labeledIssue.issue.node_id = 3;

      await probot.receive({ name: 'issues', payload: labeledIssue });
      expect(projectCard.deleteProjectCard).toHaveBeenCalled();
      expect(projectCard.addProjectCard).toHaveBeenCalled();
    });

    test('no Zube workspace', async () => {
      const labeledIssue = cloneDeep(issuesLabeled);
      labeledIssue.issue.title = 'Send GAM categories from article';
      labeledIssue.issue.node_id = 1;

      await probot.receive({ name: 'issues', payload: labeledIssue });
      expect(projectCard.deleteProjectCard).toHaveBeenCalled();
      expect(projectCard.addProjectCard).toHaveBeenCalledTimes(0);
    });

    test('labeled with priority label', async () => {
      const labeledIssuePriority = cloneDeep(issuesLabeled);
      labeledIssuePriority.label = { name: 'P5' };

      await probot.receive({ name: 'issues', payload: labeledIssuePriority });
      expect(zube.updatePriority).toHaveBeenCalled();
    });

    test('with same column', async () => {
      const labeledIssue = cloneDeep(issuesLabeled);
      labeledIssue.issue.title = 'Create AB test for black header';
      labeledIssue.issue.node_id = 1;
      await probot.receive({ name: 'issues', payload: labeledIssue });
      expect(projectCard.deleteProjectCard).toHaveBeenCalledTimes(0);
      expect(projectCard.addProjectCard).toHaveBeenCalledTimes(0);
    });
  });

  describe('issues.unlabeled', () => {
    test('with project cards', async () => {
      const unlabeledIssue = cloneDeep(issuesLabeled);
      unlabeledIssue.action = 'unlabeled';
      unlabeledIssue.issue.node_id = 1;

      await probot.receive({ name: 'issues', payload: unlabeledIssue });
      expect(projectCard.moveProjectCard).toHaveBeenCalled();
    });

    test('labeled with priority label', async () => {
      const labeledIssuePriority = cloneDeep(issuesLabeled);
      labeledIssuePriority.label = { name: 'P5' };
      labeledIssuePriority.action = 'unlabeled';

      await probot.receive({ name: 'issues', payload: labeledIssuePriority });
      expect(zube.updatePriority).toHaveBeenCalledTimes(0);
    });
  });

  describe('project_card.created', () => {
    test('with no Zube label', async () => {
      const createdProjectCard = cloneDeep(projectCardCreated);
      createdProjectCard.project_card.node_id = 2;

      await probot.receive({ name: 'project_card', payload: createdProjectCard });
      expect(zube.moveZubeCard).toHaveBeenCalled();
    });

    test('has same Zube label', async () => {
      const createdProjectCard = cloneDeep(projectCardCreated);
      createdProjectCard.project_card.node_id = 4;

      await probot.receive({ name: 'project_card', payload: createdProjectCard });
      expect(projectCard.moveProjectCard).toHaveBeenCalledTimes(0);
    });

    test('has different Zube label', async () => {
      const createdProjectCard = cloneDeep(projectCardCreated);
      createdProjectCard.project_card.node_id = 5;

      await probot.receive({ name: 'project_card', payload: createdProjectCard });
      expect(projectCard.moveProjectCard).toHaveBeenCalled();
    });

    test('no Zube card', async () => {
      const createdProjectCard = cloneDeep(projectCardCreated);
      createdProjectCard.project_card.node_id = 6;

      await probot.receive({ name: 'project_card', payload: createdProjectCard });
      expect(projectCard.moveProjectCard).toHaveBeenCalledTimes(0);
    });

    test('has Zube card which has no workspace', async () => {
      const createdProjectCard = cloneDeep(projectCardCreated);
      createdProjectCard.project_card.node_id = 6;

      await probot.receive({ name: 'project_card', payload: createdProjectCard });
      expect(projectCard.moveProjectCard).toHaveBeenCalledTimes(0);
    });
  });

  describe('project_card.moved', () => {
    test('no issue', async () => {
      const movedProjectCard = cloneDeep(projectCardMoved);
      movedProjectCard.project_card.node_id = 6;

      await probot.receive({ name: 'project_card', payload: movedProjectCard });
      expect(label.addLabel).toHaveBeenCalledTimes(0);
    });

    test('with issue', async () => {
      const movedProjectCard = cloneDeep(projectCardMoved);
      movedProjectCard.project_card.node_id = 3;

      await probot.receive({ name: 'project_card', payload: movedProjectCard });
      expect(label.addLabel).toHaveBeenCalled();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});

// For more information about testing with Jest see:
// https://facebook.github.io/jest/
