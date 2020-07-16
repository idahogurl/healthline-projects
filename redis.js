const Redis = require('ioredis');

require('dotenv').config();

// used when card is moved so 'labeled' and 'unlabeled' handlers are not ran
// probably needs to be done in card created or issue opened
// expire record in 11 seconds, the timeout of GitHub is 10 seconds
module.exports = {
  getClient: () => new Redis({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    showFriendlyErrorStack: process.env.ENV === 'dev',
  }),
  isLocked: async (client, issueNumber) => client.get(`issue:${issueNumber}`),
  lock: async (client, issueNumber) => client.set(`issue:${issueNumber}`, new Date().toISOString(), 'EX', '11000'),
  unlock: async (client, issueNumber) => client.del(`issue:${issueNumber}`),
};
