/* eslint-env jest, node */
const label = require('../data-access/label');
const projectCard = require('../data-access/project-card');
const { spyOnObject, mockContext } = require('./utils');
const projectCardMoved = require('./fixtures/github/project-card-moved.json');

jest.mock('../data-access/label');
beforeAll(() => {
  spyOnObject('../data-access/label', label);
});
test('with label not found', async () => {
  const movedProjectCard = {
    ...projectCardMoved,
    project_card: { ...projectCardMoved.project_card },
  };
  movedProjectCard.project_card.node_id = 3;
  const context = mockContext({ payload: movedProjectCard });
  const projectCardDetails = await projectCard.getProjectCardDetails(context);
  const { issue } = projectCardDetails;
  const didAdd = await label.addLabel({
    context,
    issue,
    existingLabelRegex: /\[zube\]:/,
    newLabel: '[zube]: Not found',
  });
  expect(didAdd).toBeUndefined();
});

test('with same label', async () => {
  const movedProjectCard = {
    ...projectCardMoved,
    project_card: { ...projectCardMoved.project_card },
  };
  movedProjectCard.project_card.node_id = 4;

  const context = mockContext({ payload: movedProjectCard });
  const projectCardDetails = await projectCard.getProjectCardDetails(context);
  const { issue } = projectCardDetails;
  const didAdd = await label.addLabel({
    context,
    issue,
    existingLabelRegex: /\[zube\]:/,
    newLabel: '[zube]: In Progress',
  });
  expect(didAdd).toBe(false);
});

test('with different label', async () => {
  const movedProjectCard = {
    ...projectCardMoved,
    project_card: { ...projectCardMoved.project_card },
  };
  movedProjectCard.project_card.node_id = 5;

  const context = mockContext({ payload: movedProjectCard });
  const projectCardDetails = await projectCard.getProjectCardDetails(context);
  const { issue } = projectCardDetails;
  const didAdd = await label.addLabel({
    context,
    issue,
    existingLabelRegex: /\[zube\]:/,
    newLabel: '[zube]: Next',
  });
  expect(didAdd).toBe(true);
});
