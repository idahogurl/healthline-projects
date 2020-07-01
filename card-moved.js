const { addLabel, getIssueFromCard } = require('./shared');

module.exports = async function onCardMoved(context) {
  const result = await getIssueFromCard(context);
  if (result) {
    const {
      issue,
      column: { name },
    } = result;
    const label = `[zube]: ${name}`;
    await addLabel(context, issue, label);
  }
};
