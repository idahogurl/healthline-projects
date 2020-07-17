const fs = require('fs');
const jsonwebtoken = require('jsonwebtoken'); // $ npm install jsonwebtoken
const request = require('request-promise-native');

require('dotenv').config();

const zubeWorkspaces = require('../zube-workspaces.json');

async function zubeRequest(context, {
  endpoint, qs, accessJwt, body, method = 'GET',
}) {
  const url = `https://zube.io/api/${endpoint}`;
  const start = new Date();
  const response = await request(url, {
    qs,
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
    qs,
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

function getZubeWorkspace({ id, name }) {
  if (id) {
    return zubeWorkspaces.find((w) => w.id === id);
  }
  if (name) {
    return zubeWorkspaces.find((w) => w.name === name.toLowerCase());
  }
}

async function getZubeCard(context, accessJwt) {
  let jwt;
  if (accessJwt) {
    jwt = accessJwt;
  } else {
    jwt = await getAccessJwt(context);
  }
  const {
    issue: { title, number },
  } = context.payload;
  // find the Zube card
  // Each card has a 'search_key' field which (as far as I can tell) must be an indexed field.
  // Searching using its value cuts the response time by half. Its value is the card's title
  // in all lower case. Also, searching by the first 2 words as cuts the time in half.
  const search = title.toLowerCase().split(' ').slice(0, 2).join(' ');

  const params = {
    endpoint: `projects/${process.env.ZUBE_PROJECT_ID}/cards`,
    qs: { search },
    accessJwt: jwt,
  };
  const { data } = await zubeRequest(context, params);
  // find issue in Zube cards
  const zubeCard = data
    .filter((d) => d.github_issue !== null)
    .find((d) => d.github_issue.number === number);
  return zubeCard;
}

async function getZubeCardDetails(context, accessJwt) {
  const zubeCard = await getZubeCard(context, accessJwt);
  if (zubeCard) {
    const {
      id, workspace_id: workspaceId, category_name: zubeCategory, priority,
    } = zubeCard;

    const zubeWorkspace = getZubeWorkspace({ id: workspaceId });
    return {
      id,
      zubeWorkspace,
      zubeCategory,
      priority,
    };
  }
}

async function moveZubeCard(context, projectCardDetails) {
  const { column, issue } = projectCardDetails;
  const accessJwt = await getAccessJwt(context);
  context.payload.issue = issue;
  const { id, zubeCategory } = await getZubeCardDetails(context, accessJwt);
  const {
    name: columnName,
    project: { name: projectName },
  } = column;

  // get Zube workspace whose name matches the the GitHub project card's project name
  const workspace = getZubeWorkspace({ name: projectName });
  // move if a different category than the current and a matching Zube workspace was found
  if (workspace && zubeCategory.toLowerCase() !== columnName.toLowerCase()) {
    await zubeRequest(context, {
      endpoint: `cards/${id}/move`,
      accessJwt,
      body: {
        destination: {
          position: 0,
          type: 'category',
          name: columnName,
          workspace_id: workspace.id,
        },
      },
      method: 'PUT',
    });
    return true;
  }
}

async function updatePriority({ context, priority, accessJwt }) {
  const zubeCard = await getZubeCard(context, accessJwt);
  if (zubeCard && zubeCard.priority !== priority) {
    await zubeRequest(context, {
      endpoint: `cards/${zubeCard.id}`,
      accessJwt,
      body: {
        ...zubeCard,
        priority,
      },
      method: 'PUT',
    });
    return true;
  }
}

module.exports = {
  zubeRequest,
  getAccessJwt,
  moveZubeCard,
  getZubeCard,
  getZubeWorkspace,
  getZubeCardDetails,
  updatePriority,
};
