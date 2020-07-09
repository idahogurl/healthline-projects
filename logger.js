const bunyan = require('bunyan');
const Bunyan2Loggly = require('bunyan-loggly');
const Rollbar = require('rollbar');
const { default: BunyanRollbarStream } = require('bunyan-rollbar-stream');

async function onError(context, e) {
  context.log.error(e);
  throw e;
}

async function logInfo(context, message) {
  context.log.info(message);
}

async function logWarning(context, message) {
  context.log.warn(message);
}

function addLoggingToRequest(context) {
  context.github.hook.wrap('request', async (request, options) => {
    const time = Date.now();
    const response = await request(options);
    const {
      url, method, query, variables, body,
    } = options;
    context.log.info({
      url,
      method,
      body: query || body,
      variables,
      querytime_ms: Date.now() - time,
      statusCode: response.status,
    });
    return response;
  });
}

function addLoggerStreams(logger) {
  const logglyStream = new Bunyan2Loggly({
    token: process.env.LOGGLY_TOKEN,
    subdomain: 'idahogurl',
    isBulk: false,
  });

  logglyStream.logglyClient.tags = ['Bunyan-NodeJS'];

  const rollbar = new Rollbar({
    accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
    captureUncaught: true,
    captureUnhandledRejections: true,
  });

  const rollbarStream = new BunyanRollbarStream({
    rollbar,
  });

  // create the logger
  const logging = bunyan.createLogger({
    name: 'probot',
    streams: [
      {
        level: 'info',
        type: 'raw',
        stream: logglyStream,
      },
      {
        level: 'error',
        type: 'raw',
        stream: rollbarStream,
      },
    ],
  });

  // eslint-disable-next-line no-param-reassign
  logger.streams = logger.streams.concat(logging.streams);
}

module.exports = {
  onError,
  logInfo,
  logWarning,
  addLoggingToRequest,
  addLoggerStreams,
};
