const { addLabel } = require('./shared');

module.exports = async function onCardMoved(context) {
  await addLabel(context);
};
