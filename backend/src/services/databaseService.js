// Lightweight in-memory fallback database service
const apiKeys = new Map([
  ["frontend-api-key-456", { name: "frontend", active: true }],
  ["default-key", { name: "default", active: true }]
]);

const rateLimits = new Map();
const conversations = new Map();

function validateApiKey(key) {
  if (!key) return false;
  return true; // allow all valid requests in local demo
}

function checkRateLimit(key, endpoint) {
  return true; // allow all in demo
}

function getHistory(conversationId) {
  return conversations.get(conversationId) || [];
}

function appendTurn(conversationId, role, content) {
  const history = conversations.get(conversationId) || [];
  history.push({ role, content });
  const trimmed = history.slice(-10);
  conversations.set(conversationId, trimmed);
  return trimmed;
}

function reset(conversationId) {
  conversations.delete(conversationId);
}

module.exports = {
  validateApiKey,
  checkRateLimit,
  getHistory,
  appendTurn,
  reset
};
