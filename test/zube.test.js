/* eslint-env jest, node */
const zube = require('../data-access/zube');
const zubeCard = require('./fixtures/zube/card.json');
const issueContext = require('./fixtures/github/issues-opened.json');
const { mockContext, spyOnObject } = require('./utils');

jest.mock('../data-access/zube');

beforeAll(() => {
  spyOnObject('../data-access/zube', zube);
});

test('zube request', async () => {
  const endpoint = 'projects/16987/cards';
  const res = await zube.zubeRequest(mockContext(), {
    endpoint,
    qs: { search: 'mnt program' },
  });
  expect(res).toMatchObject(zubeCard);
});

test('get access token', async () => {
  const accessToken = await zube.getAccessJwt({
    log: {
      info: (x) => {
        console.log(x);
      },
    },
  });
  expect(accessToken).toBe('test');
});

describe('getZubeWorkspace', () => {
  test('get by name and found', () => {
    const workspace = zube.getZubeWorkspace({ name: 'Team Rocket' });
    expect(workspace).toMatchObject({
      id: 23683,
      name: 'team rocket',
    });
  });

  test('get by name and not found', () => {
    const workspace = zube.getZubeWorkspace({ name: 'PM - Tony Stark' });
    expect(workspace).toBeUndefined();
  });

  test('get by id and found', () => {
    const workspace = zube.getZubeWorkspace({ id: 23683 });
    expect(workspace).toMatchObject({
      id: 23683,
      name: 'team rocket',
    });
  });

  test('get by id not found', () => {
    const workspace = zube.getZubeWorkspace({ id: 12345 });
    expect(workspace).toBeUndefined();
  });
});

test('updatePriority with same priority', async () => {
  const didUpdate = await zube.updatePriority({
    context: mockContext({ payload: issueContext }),
    priority: 4,
    accessJwt: 'test',
  });
  expect(didUpdate).toBeUndefined();
});

test('updatePriority with different priority', async () => {
  const didUpdate = await zube.updatePriority({
    context: mockContext({ payload: issueContext }),
    priority: 5,
    accessJwt: 'test',
  });
  expect(didUpdate).toBe(true);
});

test('getZubeCardDetails with card not found', async () => {
  const payload = { ...issueContext, issue: { ...issueContext.issue, title: 'Not found' } };
  const details = await zube.getZubeCardDetails(mockContext({ payload }), 'test');
  expect(details).toBeUndefined();
});
test('getZubeCardDetails with card found', async () => {
  const details = await zube.getZubeCardDetails(mockContext({ payload: issueContext }), 'test');
  expect(details).toMatchObject({
    id: 5903798,
    zubeWorkspace: { id: 23683, name: 'team rocket' },
    zubeCategory: 'Next',
    priority: 4,
  });
});

test('getZubeCardDetails with no access jwt', async () => {
  await zube.getZubeCardDetails(mockContext({ payload: issueContext }));
  expect(zube.getAccessJwt).toHaveBeenCalled();
});

test('moveZubeCard with different category', async () => {
  const didMove = await zube.moveZubeCard(mockContext({ payload: issueContext }), {
    column: {
      name: 'To Do',
      project: { name: 'Team Rocket' },
    },
    issue: issueContext.issue,
  });
  expect(didMove).toBe(true);
});

test('moveZubeCard with same category', async () => {
  const didMove = await zube.moveZubeCard(mockContext({ payload: {} }), {
    column: {
      name: 'Next',
      project: { name: 'Team Rocket' },
    },
    issue: issueContext.issue,
  });
  expect(didMove).toBeUndefined();
});
