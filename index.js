const { onError } = require('./error-handler');
const onIssueLabeled = require('./issue-labeled');
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
    // "Add to Source" opens the card and then labels it
    app.on('issues.labeled', async (context) => {
      try {
        return onIssueLabeled(context);
      } catch (e) {
        onError(e, context);
      }
    });

    app.on('project_card.created', async (context) => {
      try {
        return onProjectCardCreated(context);
      } catch (e) {
        onError(e, context);
      }
    });

    app.on('project_card.moved', async (context) => {
      try {
        return onProjectCardMoved(context);
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
