const { addLabel, getIssueFromCard, moveZubeCard } = require('./shared');

module.exports = async function onCardMoved(context) {
  const result = await getIssueFromCard(context);
  if (result) {
    const {
      issue,
      column: { name },
    } = result;
    // move to different board in Zube
    const label = `[zube]: ${name}`;
    await addLabel({
      context,
      issue,
      existingLabelRegex: /\[zube\]:/,
      newLabel: label,
    });
    await moveZubeCard(issue, result);
  }
};
