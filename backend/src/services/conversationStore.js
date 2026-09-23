// In-memory conversation store keyed by conversationId.
// Sufficient for demo scale; a production system would use Redis or a DB with TTL.
const conversations = new Map();

function getHistory(conversationId) {
  return conversations.get(conversationId) || [];
}

function appendTurn(conversationId, role, content) {
  const history = conversations.get(conversationId) || [];
  history.push({ role, content });
  // Keep last 10 turns to bound context size
  const trimmed = history.slice(-10);
  conversations.set(conversationId, trimmed);
  return trimmed;
}

function reset(conversationId) {
  conversations.delete(conversationId);
}

module.exports = { getHistory, appendTurn, reset };
