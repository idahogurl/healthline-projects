const fs = require('fs');
const jsonwebtoken = require('jsonwebtoken'); // $ npm install jsonwebtoken
const request = require('request-promise-native');

require('dotenv').config();

async function zubeRequest({ endpoint, accessJwt, method = 'GET' }) {
  return request(`https://zube.io/api/${encodeURI(endpoint)}`, {
    method,
    json: true,
    headers: {
      'X-Client-ID': process.env.ZUBE_CLIENT_ID,
      accept: 'application/json',
    },
    auth: { bearer: accessJwt },
  });
}

async function getAccessJwt() {
  console.log('CLIENT_ID', process.env.ZUBE_CLIENT_ID);
  const clientId = process.env.ZUBE_CLIENT_ID;
  const privateKey = fs.readFileSync(process.env.ZUBE_PRIVATE_KEY_PATH, { encoding: 'utf8' });

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

  return zubeRequest({
    endpoint: 'users/tokens',
    method: 'POST',
    accessJwt: refreshJwt,
    clientId,
  });
}

module.exports = {
  zubeRequest,
  getAccessJwt,
};
