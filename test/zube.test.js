/* eslint-env jest */
const { getAccessJwt, zubeRequest } = require('../zube');
const zubeCard = require('./fixtures/zube/card.json');
const zubeUserToken = require('./fixtures/zube/user.token.json');

test('zube request', async () => {
  const endpoint = 'projects/16987/cards?search=MNT program pages show "Healthline"';
  const res = await zubeRequest({
    endpoint,
  });
  expect(res).toMatchObject(zubeCard);
});

test('get access token', async () => {
  const accessToken = await getAccessJwt();
  expect(accessToken).toBe(zubeUserToken.access_token);
});
