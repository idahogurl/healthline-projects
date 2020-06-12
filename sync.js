const request = require('request-promise-native');
const { zubeRequest, getAccessJwt } = require('./zube');

require('dotenv').config();

const columns = {
  inbox: 9403733,
  backlog: 9403734,
  small: 9403735,
  next: 9577676,
  'in progress': 9403736,
  'in review': 9403737,
  done: 9403739,
};

const GITHUB_API_URL = 'https://api.github.com';
async function gitHubRequest({ endpoint, body, method = 'POST' }) {
  return request(`${GITHUB_API_URL}/${endpoint}`, {
    method,
    headers: {
      'User-Agent': 'Zube migration',
      Accept: 'application/vnd.github.inertia-preview+json',
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
    },
    json: true,
    body,
  });
}

module.exports = async () => {
  try {
    const { access_token: accessJwt } = await getAccessJwt();

    const { data } = await zubeRequest({
      endpoint: 'workspaces?where[name]=Team PiP&select[]=id',
      accessJwt,
    });

    const [workspace] = data;

    // get the columns
    const { data: cards } = await zubeRequest({
      endpoint: `cards?per_page=100&where[workspace_id]=${workspace.id}&where[state]=open`,
      accessJwt,
    });
    // console.log(cards);
    const promises = [];
    console.log('Num of cards:', cards.length);

    cards.forEach((c) => {
      if (c.github_issue !== null) {
        const { priority, github_issue: gitHubIssue, category_name: columnName } = c;
        const { id: issueId, number: issueNumber } = gitHubIssue;
        // get project column matching Zube category name
        const columnId = columns[columnName.toLowerCase()];
        if (columnId) {
          const createCard = {
            endpoint: `projects/columns/${columnId}/cards`,
            body: {
              content_id: issueId,
              content_type: 'Issue',
            },
          };
          console.log(createCard);
          promises.push(gitHubRequest(createCard));

          // add priority label
          if (priority !== null) {
            const addLabel = {
              endpoint: `repos/healthline/frontend/issues/${issueNumber}/labels`,
              body: {
                labels: [`P${priority}`],
              },
            };
            console.log(addLabel);
            promises.push(gitHubRequest(addLabel));
          }
        } else {
          console.error(`${columnName.toLowerCase()} not found`);
        }
        // create project card in GitHub
      }
    });
    console.log('Num of cards processed:', promises.length);
    await Promise.all(promises);
  } catch (e) {
    console.trace(e);
  }
};
