const kb = require("../data/knowledgeBase.json");

/**
 * Flattens the knowledge base into retrievable text chunks with a source
 * label, so retrieved context can be cited and the LLM has clearly scoped
 * facts to ground its answer in (instead of open-ended freeform knowledge).
 */
function buildChunks() {
  const chunks = [];
  chunks.push({ source: "hotel.checkInTime", text: `Check-in time is ${kb.hotel.checkInTime}.` });
  chunks.push({ source: "hotel.checkOutTime", text: `Check-out time is ${kb.hotel.checkOutTime}.` });
  chunks.push({ source: "hotel.cancellationPolicy", text: `Cancellation policy: ${kb.hotel.cancellationPolicy}` });
  chunks.push({ source: "hotel.breakfast", text: `Breakfast: ${kb.hotel.breakfast}` });
  kb.hotel.amenities.forEach((a) => {
    chunks.push({ source: `amenity.${a.name}`, text: `${a.name}: ${a.details}` });
  });
  kb.rooms.forEach((r) => {
    chunks.push({
      source: `room.${r.id}`,
      text: `${r.name}: sleeps up to ${r.maxGuests} guests, $${r.pricePerNight}/night. ${r.description}`
    });
  });
  kb.faqs.forEach((f, i) => {
    chunks.push({ source: `faq.${i}`, text: `Q: ${f.question} A: ${f.answer}` });
  });
  return chunks;
}

const CHUNKS = buildChunks();

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "what", "which", "does", "do", "for",
  "of", "to", "in", "on", "at", "and", "or", "have", "has", "i", "you",
  "your", "my", "can", "with", "about", "there"
]);

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    // drop stopwords and stray single-character fragments (e.g. the "s"
    // left behind by apostrophes in "what's" / "night's")
    .filter((t) => t && t.length > 1 && !STOPWORDS.has(t));
}

/**
 * Very small keyword-overlap retriever. Returns the top matching chunks
 * (and a confidence score) so the caller can decide whether there's
 * enough grounding to answer, or whether to fall back.
 */
function retrieve(query, topK = 4) {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return [];

  const scored = CHUNKS.map((chunk) => {
    const chunkTokens = tokenize(chunk.text);
    let overlap = 0;
    chunkTokens.forEach((t) => {
      if (queryTokens.has(t)) overlap += 1;
    });
    return { ...chunk, score: overlap };
  });

  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

module.exports = { retrieve, buildChunks };
