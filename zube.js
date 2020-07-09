const fs = require('fs');
const jsonwebtoken = require('jsonwebtoken'); // $ npm install jsonwebtoken
const request = require('request-promise-native');

require('dotenv').config();

async function zubeRequest(context, {
  endpoint, accessJwt, body, method = 'GET',
}) {
  const url = `https://zube.io/api/${encodeURI(endpoint)}`;
  const start = new Date();
  const response = await request(url, {
    method,
    json: true,
    headers: {
      'X-Client-ID': process.env.ZUBE_CLIENT_ID,
      accept: 'application/json',
    },
    auth: { bearer: accessJwt },
    body,
  });
  context.log.info({
    url,
    method,
    body,
    statusCode: response.statusCode,
    querytime_ms: new Date().getTime() - start.getTime(),
  });
  return response;
}

async function getAccessJwt(context) {
  const clientId = process.env.ZUBE_CLIENT_ID;
  const privateKey = process.env.ENV === 'prod'
    ? process.env.ZUBE_PRIVATE_KEY
    : fs.readFileSync(process.env.ZUBE_PRIVATE_KEY_PATH, { encoding: 'utf8' });

  const now = Math.floor(Date.now() / 1000);
  const refreshJwt = jsonwebtoken.sign(
    {
      iat: now, // Issued at time
      exp: now + 60, // JWT expiration time (10 minute maximum)
      iss: clientId, // Your Zube client id
    },
    privateKey,
    { algorithm: 'RS256' },
  );

  const { access_token: accessJwt } = await zubeRequest(context, {
    endpoint: 'users/tokens',
    method: 'POST',
    accessJwt: refreshJwt,
    clientId,
  });
  return accessJwt;
}

module.exports = {
  zubeRequest,
  getAccessJwt,
};
