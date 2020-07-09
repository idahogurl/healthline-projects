const Bunyan2Loggly = require('bunyan-loggly');
const bunyanRollbar = require('bunyan-rollbar');

module.exports = function addStreams(logger) {
  logger.streams.pop();
  logger.streams.push(
    {
      level: 'info',
      type: 'raw',
      stream: new Bunyan2Loggly({
        token: process.env.LOGGLY_TOKEN,
        subdomain: 'idahogurl',
      }),
    },
    {
      level: 'error',
      type: 'raw', // Must be set to raw for use with BunyanRollbar
      stream: new bunyanRollbar.Stream({
        rollbarToken: process.env.ROLLBAR_ACCESS_TOKEN,
        rollbarOptions: {
          captureUncaught: true,
          captureUnhandledRejections: true,
        }, // Additional options to pass to rollbar.init()
      }),
    },
  );
};
