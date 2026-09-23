const express = require("express");
const { randomUUID } = require("crypto");
const { detectIntent } = require("../services/intentService");
const { retrieve } = require("../services/retrievalService");
const { callLLM } = require("../services/llmService");
const { validateAvailabilityRequest, checkAvailability } = require("../services/availabilityService");
const { getHistory, appendTurn } = require("../services/conversationStore");

const router = express.Router();

function logRequest(label, data) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), label, ...data }));
}

router.post("/chat", async (req, res) => {
  const { message, conversationId, availability } = req.body || {};

  // --- Validation -----------------------------------------------------
  if (!availability && (typeof message !== "string" || message.trim().length === 0)) {
    return res.status(400).json({
      error: { code: "INVALID_REQUEST", message: "`message` is required and must be a non-empty string." }
    });
  }

  const convId = conversationId || randomUUID();

  try {
    const intent = detectIntent(message, availability);
    logRequest("chat_request", { convId, intent, message });

    // --- Greeting path ------------------------------------------------
    if (intent === "greeting") {
      appendTurn(convId, "user", message);
      const reply = "Hello and welcome to Harborview Grand! I am your AI concierge. How may I assist you today? You can ask about check-in times, amenities, dining, hotel policies, or check room availability.";
      appendTurn(convId, "assistant", reply);
      return res.status(200).json({
        conversationId: convId,
        type: "answer",
        reply,
        meta: {
          usedFallback: false,
          source: "concierge_greeting",
          retrievedSources: []
        }
      });
    }

    // --- Gratitude path -----------------------------------------------
    if (intent === "gratitude") {
      appendTurn(convId, "user", message);
      const reply = "You are very welcome! Please let me know if there is anything else I can assist you with during your stay at Harborview Grand.";
      appendTurn(convId, "assistant", reply);
      return res.status(200).json({
        conversationId: convId,
        type: "answer",
        reply,
        meta: {
          usedFallback: false,
          source: "concierge_gratitude",
          retrievedSources: []
        }
      });
    }

    // --- Specific Booking Request path --------------------------------
    if (intent === "booking_request") {
      const history = getHistory(convId);
      const lastAvailTurn = [...history].reverse().find(
        (t) => t.content && t.content.includes("Availability results for")
      );

      let datesInfo = "";
      if (lastAvailTurn) {
        const match = lastAvailTurn.content.match(/for\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/);
        if (match) {
          datesInfo = `for ${match[1]} to ${match[2]}`;
        }
      }

      const matchRoom = message.match(/(triple\s+room|standard\s+queen|deluxe\s+king|family\s+suite|triple|queen|king|suite)/i);
      const roomFormatted = matchRoom
        ? matchRoom[0].replace(/\b\w/g, (c) => c.toUpperCase())
        : "Selected Room";

      appendTurn(convId, "user", message);
      const reply = datesInfo
        ? `To finalize your reservation for the ${roomFormatted} (${datesInfo}), our front desk reservation team is available at +1 (555) 019-2834, or you may provide your booking confirmation code directly at check-in. Free cancellation applies up to 48 hours before check-in. Would you like me to note any special arrival requests for your stay?`
        : `To reserve the ${roomFormatted}, please call our front desk directly at +1 (555) 019-2834. If you have specific dates in mind, I can also check live rates and open inventory for you anytime!`;
      appendTurn(convId, "assistant", reply);

      return res.status(200).json({
        conversationId: convId,
        type: "answer",
        reply,
        meta: {
          usedFallback: false,
          source: "booking_concierge",
          retrievedSources: []
        }
      });
    }

    // --- Availability path (deterministic, no LLM invents numbers) ----
    if (intent === "availability" || availability) {
      const payload = availability || {};
      const { valid, errors } = validateAvailabilityRequest(payload);

      if (!valid) {
        appendTurn(convId, "user", message || "[availability request]");
        return res.status(200).json({
          conversationId: convId,
          type: "availability_error",
          reply:
            "I need a bit more information to check availability: " + errors.join(" "),
          errors
        });
      }

      const result = checkAvailability(payload.checkIn, payload.checkOut, payload.adults);
      appendTurn(convId, "user", message || "[availability request]");
      appendTurn(
        convId,
        "assistant",
        `Availability results for ${payload.checkIn} to ${payload.checkOut}, ${payload.adults} guest(s).`
      );

      return res.status(200).json({
        conversationId: convId,
        type: "availability",
        reply:
          result.results.some((r) => r.available)
            ? `Here are the available rooms for ${result.nights} night(s), ${payload.adults} guest(s):`
            : "I'm sorry, no rooms matching that party size are available for those dates.",
        availability: result
      });
    }

    if (intent === "availability_needs_details") {
      appendTurn(convId, "user", message);
      const reply =
        "I would be glad to check room availability for you. Please choose your check-in date, check-out date, and number of guests below.";
      appendTurn(convId, "assistant", reply);
      return res.status(200).json({
        conversationId: convId,
        type: "availability_needs_details",
        reply
      });
    }

    // --- General question path (retrieval + LLM) -----------------------
    const history = getHistory(convId);
    const contextChunks = retrieve(message);
    const llmResult = await callLLM({ question: message, contextChunks, history });

    appendTurn(convId, "user", message);
    appendTurn(convId, "assistant", llmResult.text);

    return res.status(200).json({
      conversationId: convId,
      type: "answer",
      reply: llmResult.text,
      meta: {
        usedFallback: llmResult.usedFallback,
        source: llmResult.source,
        retrievedSources: contextChunks.map((c) => c.source)
      }
    });
  } catch (err) {
    logRequest("chat_error", { convId, error: err.message });
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Something went wrong processing your request. Please try again." }
    });
  }
});

module.exports = router;
