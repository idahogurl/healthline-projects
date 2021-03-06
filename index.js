/* istanbul ignore file */
const { addLoggerStreams, onError } = require('./logger');
const onIssueOpened = require('./event-handler/issue-opened');
const onIssueLabeled = require('./event-handler/issue-labeled');
const onIssueUnlabeled = require('./event-handler/issue-unlabeled');
const onProjectCardCreated = require('./event-handler/card-created');
const onProjectCardMoved = require('./event-handler/card-moved');

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
