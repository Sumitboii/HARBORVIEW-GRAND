const FALLBACK_MESSAGE =
  "I don't have reliable information about that in what I know about this hotel. " +
  "Could you rephrase your question, or contact the front desk directly for details?";

/**
 * Calls Gemini API (via REST) with a strict system prompt scoped to ONLY
 * the retrieved knowledge-base context.
 * Falls back gracefully on errors so the guest always gets a response.
 */
async function callLLM({ question, contextChunks, history }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_LLM_MODEL || "models/gemini-3.6-flash";

  const contextText = contextChunks.length
    ? contextChunks.map((c) => `- ${c.text}`).join("\n")
    : "(no relevant information found in the knowledge base)";

  const systemInstruction =
    "You are a professional hotel guest assistant for Harborview Grand Hotel. " +
    "Answer ONLY using the CONTEXT below. If the context does not contain " +
    "the answer, say clearly that you don't have that information and " +
    "suggest contacting the front desk — do not guess or invent details. " +
    "Never state or imply room availability; availability is handled separately. " +
    "Do NOT use any emojis or informal symbols in your response. Keep answers concise, formal, and helpful.\n\nCONTEXT:\n" +
    contextText;

  // No context retrieved at all -> deterministic fallback, skip the LLM call.
  if (contextChunks.length === 0) {
    return { text: FALLBACK_MESSAGE, usedFallback: true, source: "no_context" };
  }

  // No API key configured -> deterministic mock responder
  if (!apiKey) {
    return {
      text: mockAnswer(question, contextChunks),
      usedFallback: false,
      source: "mock_llm"
    };
  }

  try {
    const contents = [];

    for (const h of history || []) {
      contents.push({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }]
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: question }]
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents,
        generationConfig: {
          maxOutputTokens: 400,
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const candidate = (data.candidates || [])[0];
    const textContent = candidate?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error("Gemini API returned no text content");
    }

    return { text: textContent.trim(), usedFallback: false, source: "gemini" };
  } catch (err) {
    console.error("Gemini LLM error:", err.message);
    // Smooth fallback from ground-truth knowledge base without noisy error message
    return {
      text: mockAnswer(question, contextChunks),
      usedFallback: false,
      source: "fallback_kb",
      error: err.message
    };
  }
}

/**
 * Deterministic templated answer used when no API key is configured or on fallback.
 * Lets the app run end-to-end (and be tested) without external dependencies.
 */
function mockAnswer(question, contextChunks) {
  const best = contextChunks[0];
  return `${best.text}${
    contextChunks.length > 1 ? " Also: " + contextChunks[1].text : ""
  }`.trim();
}

module.exports = { callLLM, FALLBACK_MESSAGE };
