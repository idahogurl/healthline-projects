const Rollbar = require('rollbar');

require('dotenv').config();

const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true,
});

async function onError(e, context) {
  if (process.env.ENV === 'prod') {
    return rollbar.error(e, context.payload, { level: 'info' });
  }
  // eslint-disable-next-line no-console
  console.error(e, context.payload);

  throw e;
}

async function logInfo(s) {
  if (process.env.ENV === 'prod') {
    console.log(s);
    return rollbar.info(s);
  }
  // eslint-disable-next-line no-console
  console.log(s);
}

module.exports = {
  onError,
  logInfo,
};
