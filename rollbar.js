// include and initialize the rollbar library with your access token
const Rollbar = require('rollbar');

module.exports = () => new Rollbar({
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true,
});
