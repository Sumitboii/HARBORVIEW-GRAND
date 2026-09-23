const AVAILABILITY_KEYWORDS = [
  "available", "availability", "vacancy", "vacant", "book", "booking",
  "reserve", "reservation", "any rooms", "room for", "free rooms",
  "do you have rooms", "check-in date", "checkin date"
];

const GREETING_REGEX = /\b(hi|hey|heyy|heyyy|hello|howdy|hola|greetings|good\s+morning|good\s+afternoon|good\s+evening|sup|yo)\b/i;
const GRATITUDE_REGEX = /\b(thank\s+you|thanks|thx|thank\s+you\s+so\s+much|appreciate\s+it|great\s+thanks)\b/i;

const HOTEL_TOPIC_KEYWORDS = [
  "check-in", "checkin", "checkout", "check-out", "pool", "swimming",
  "breakfast", "room", "rooms", "cancel", "cancellation", "wifi",
  "amenit", "restaurant", "dining", "spa", "park", "gym", "pet", "pets",
  "rate", "price", "cost", "policy", "policies", "available", "availability"
];

const SPECIFIC_ROOM_REGEX = /\b(triple|standard\s+queen|deluxe\s+king|family\s+suite|queen|king|suite)\b/i;
const BOOKING_ACTION_REGEX = /\b(book|reserve|reserve\s+the|book\s+the|confirm\s+booking|booking\s+for)\b/i;

/**
 * Deterministic keyword-based intent classifier. Kept outside the LLM so
 * availability routing is predictable and testable. If the message text
 * or an explicit structured payload signals availability, we route to the
 * deterministic availability service instead of asking the LLM to answer.
 */
function detectIntent(message, explicitAvailabilityPayload) {
  if (explicitAvailabilityPayload) return "availability";
  const lower = (message || "").trim().toLowerCase();

  const hasHotelTopic = HOTEL_TOPIC_KEYWORDS.some((kw) => lower.includes(kw));

  // If it's a greeting without specific hotel inquiries, route to warm concierge greeting
  if (GREETING_REGEX.test(lower) && !hasHotelTopic) {
    return "greeting";
  }

  // If it's pure gratitude, route to gratitude handler
  if (GRATITUDE_REGEX.test(lower) && !hasHotelTopic) {
    return "gratitude";
  }

  // Specific room booking request (e.g. "book triple room", "reserve deluxe king")
  if (BOOKING_ACTION_REGEX.test(lower) && SPECIFIC_ROOM_REGEX.test(lower)) {
    return "booking_request";
  }

  const hasDatePattern = /\d{4}-\d{2}-\d{2}/.test(lower) || /\b(20\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/.test(lower);
  const hasKeyword = AVAILABILITY_KEYWORDS.some((kw) => lower.includes(kw));

  if (hasKeyword && (hasDatePattern || lower.includes("guest") || lower.includes("adult") || lower.includes("people"))) {
    return "availability";
  }
  if (hasKeyword) return "availability_needs_details";
  return "general_question";
}

module.exports = { detectIntent };
