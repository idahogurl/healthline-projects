const { addLoggerStreams } = require('./logger');
const { onError } = require('./logger');
const onIssueOpened = require('./issue-opened');
const onIssueLabeled = require('./issue-labeled');
const onIssueUnlabeled = require('./issue-unlabeled');
const onProjectCardCreated = require('./card-created');
const onProjectCardMoved = require('./card-moved');

require('dotenv').config();

/**
 * This is the main entry point to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = (app) => {
  if (process.env.ENV === 'prod') {
    addLoggerStreams(app.log.target);
  }

  // sometimes Zube doesn't add a label when 'Add to Source' is called
  app.on('issues.opened', (context) => onIssueOpened(context).catch((e) => {
    onError(context, e);
  }));

  // Zube uses GitHub labels to set the issue's project column
  // (called "workspace categories" in Zube)
  app.on('issues.labeled', (context) => onIssueLabeled(context).catch((e) => {
    onError(context, e);
  }));

  app.on('issues.unlabeled', (context) => onIssueUnlabeled(context).catch((e) => {
    onError(context, e);
  }));

  app.on('project_card.created', (context) => onProjectCardCreated(context).catch((e) => {
    onError(context, e);
  }));

  app.on('project_card.moved', (context) => onProjectCardMoved(context).catch((e) => {
    onError(context, e);
  }));
};
// For more information on building apps:
// https://probot.github.io/docs/

// To get your app running against GitHub, see:
// https://probot.github.io/docs/development/
