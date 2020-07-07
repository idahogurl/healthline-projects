const { onError } = require('./error-handler');
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
  app.log('Yay, the app was loaded!');
  try {
    app.on('issues.opened', async (context) => {
      try {
        return onIssueOpened(context);
      } catch (e) {
        onError(e, context);
      }
    });
    // Zube uses GitHub labels to set the issue's project column
    // (called "workspace categories" in Zube)
    app.on('issues.labeled', async (context) => {
      try {
        await onIssueLabeled(context);
      } catch (e) {
        onError(e, context);
      }
    });

    app.on('issues.unlabeled', async (context) => {
      try {
        await onIssueUnlabeled(context);
      } catch (e) {
        onError(e, context);
      }
    });

    app.on('project_card.created', async (context) => {
      try {
        await onProjectCardCreated(context);
      } catch (e) {
        onError(e, context);
      }
    });

    app.on('project_card.moved', async (context) => {
      try {
        await onProjectCardMoved(context);
      } catch (e) {
        onError(e, context);
      }
    });
  } catch (e) {
    onError(e);
  }
};

// For more information on building apps:
// https://probot.github.io/docs/

// To get your app running against GitHub, see:
// https://probot.github.io/docs/development/
