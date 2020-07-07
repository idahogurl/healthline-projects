const Rollbar = require('rollbar');

require('dotenv').config();

const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true,
});

async function onError(e, context) {
  if (process.env.ENV === 'prod') {
    rollbar.error(e, context.payload);
  }
  // eslint-disable-next-line no-console
  console.error(e, context.payload);

  throw e;
}

async function logInfo(s, target) {
  if (process.env.ENV === 'prod' && target === 'rollbar') {
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
