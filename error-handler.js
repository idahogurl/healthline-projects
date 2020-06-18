const Rollbar = require('rollbar');

require('dotenv').config();

const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true,
});

function onError(e, context) {
  if (process.env.ENV === 'prod') {
    rollbar.error(e, context.payload, { level: 'info' });
  } else {
    // eslint-disable-next-line no-console
    console.error(e, context.payload);
  }
  throw e;
}

function logInfo(s) {
  if (process.env.ENV === 'prod') {
    rollbar.info(s);
  } else {
    // eslint-disable-next-line no-console
    console.log(s);
  }
}

module.exports = {
  onError,
  logInfo,
};
