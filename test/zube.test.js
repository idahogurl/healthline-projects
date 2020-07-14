/* eslint-env jest */
const { getAccessJwt, zubeRequest } = require('../zube');
const zubeCard = require('./fixtures/zube/card.json');

test('zube request', async () => {
  const endpoint = 'projects/16987/cards';
  const res = await zubeRequest(
    {
      log: {
        info: (x) => {
          console.log(x);
        },
      },
    },
    {
      endpoint,
      qs: { search: 'mnt program' },
    },
  );
  expect(res).toMatchObject(zubeCard);
});

test('get access token', async () => {
  const accessToken = await getAccessJwt({
    log: {
      info: (x) => {
        console.log(x);
      },
    },
  });
  expect(accessToken).toBe('test');
});
