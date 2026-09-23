# Architecture

## High-level

```
 Browser (Next.js)                Backend (Express)                  Anthropic API
 ┌────────────────┐   HTTPS/JSON   ┌───────────────────┐   HTTPS      ┌───────────┐
 │ ChatWindow      │──────────────▶│ POST /api/chat     │─────────────▶│ Claude     │
 │  AvailabilityForm│               │  intentService     │  (optional,  │ (optional) │
 │  MessageBubble  │◀──────────────│  retrievalService   │   mock if   └───────────┘
 └────────────────┘   JSON reply   │  availabilityService│   no key)
                                    │  llmService         │
                                    │  conversationStore   │
                                    └───────────┬─────────┘
                                                │
                                     knowledgeBase.json
```

- **Frontend (Next.js/React):** guest-facing chat UI. Talks only to the
  backend's `/api/chat` endpoint — never to the LLM directly, and holds no
  API keys (`REQ-019`, `REQ-020`).
- **Backend (Express):** single `/api/chat` endpoint that classifies intent,
  retrieves relevant facts, and either calls the deterministic availability
  service or the LLM service.
- **AI:** Anthropic's Messages API, used only for phrasing general-question
  answers from retrieved context. Falls back to a templated "mock LLM" mode
  with no API key configured, so the app runs with zero external
  dependencies.

### Why these choices
- **Express over a heavier framework:** the API surface is one endpoint
  plus health check; Express keeps that fast to build and easy to read.
- **Next.js for the frontend:** explicitly preferred by the brief; gives
  file-based routing and a simple dev server with no extra config.
- **In-memory conversation store, not a database:** the assignment is a
  demo-scale app (6–8 hours); a DB would add setup friction without
  changing the design being evaluated. Called out as a production gap in
  the README.
- **Keyword retrieval, not embeddings:** the knowledge base is ~15 small
  facts. Embedding search would add a vector DB and an extra API call for
  no real accuracy gain at this size; keyword overlap is transparent,
  fast, and easy to unit test.

## Data flow

1. Guest submits a message (and optionally an availability payload) from
   the frontend.
2. Backend validates the request shape.
3. `intentService.detectIntent` classifies it: `availability`,
   `availability_needs_details`, or `general_question`.
4. **Availability path:** `availabilityService.validateAvailabilityRequest`
   checks dates/guest count → if valid, `checkAvailability` (deterministic,
   seeded — no AI) returns per-room results.
5. **General question path:** `retrievalService.retrieve` finds the
   top matching knowledge-base chunks by keyword overlap → if none found,
   return the fixed fallback message without calling the LLM → otherwise
   `llmService.callLLM` sends the question, retrieved context (as a system
   prompt), and recent conversation history to Claude (or the mock
   responder) and returns its answer.
6. The turn is appended to the in-memory conversation history, keyed by
   `conversationId`.
7. Backend returns a structured JSON response; frontend renders it as a
   chat bubble or an availability results card.

## API contract

### `POST /api/chat`

**Request**
```json
{
  "message": "What time is check-in?",
  "conversationId": "optional-existing-id",
  "availability": {
    "checkIn": "2027-03-01",
    "checkOut": "2027-03-03",
    "adults": 2
  }
}
```
- `message` — required string unless `availability` is present (the frontend always sends a placeholder message alongside a form submission).
- `conversationId` — optional; server generates one (UUID) if omitted.
- `availability` — optional object; when present, the request is always routed to the deterministic availability path regardless of `message` text.

**Response — general question (`200`)**
```json
{
  "conversationId": "uuid",
  "type": "answer",
  "reply": "Check-in is at 3:00 PM.",
  "meta": { "usedFallback": false, "source": "llm", "retrievedSources": ["hotel.checkInTime"] }
}
```

**Response — availability (`200`)**
```json
{
  "conversationId": "uuid",
  "type": "availability",
  "reply": "Here's what I found for 2 night(s), 2 guest(s):",
  "availability": {
    "checkIn": "2027-03-01", "checkOut": "2027-03-03", "adults": 2, "nights": 2,
    "results": [
      { "roomId": "standard-queen", "roomName": "Standard Queen", "maxGuests": 2,
        "pricePerNight": 149, "nights": 2, "totalPrice": 298,
        "available": true, "unitsAvailable": 2 }
    ]
  }
}
```

**Response — availability validation error (`200`, guest-correctable)**
```json
{
  "conversationId": "uuid",
  "type": "availability_error",
  "reply": "I need a bit more information to check availability: checkOut must be after checkIn.",
  "errors": ["checkOut must be after checkIn."]
}
```
This is returned as `200`, not `400`: it's an expected conversational
outcome (ask the guest to correct their input), not a malformed API
request.

**Response — malformed request (`400`)**
```json
{ "error": { "code": "INVALID_REQUEST", "message": "`message` is required and must be a non-empty string." } }
```

**Response — server error (`500`)**
```json
{ "error": { "code": "INTERNAL_ERROR", "message": "Something went wrong processing your request. Please try again." } }
```

### `GET /api/health`
`200 { "status": "ok" }` — liveness check.

### Error shape (all errors)
`{ "error": { "code": string, "message": string } }` — `code` is a stable machine-readable identifier the frontend could later switch on; `message` is guest-safe copy.

## Data contract

**Knowledge base** (`backend/src/data/knowledgeBase.json`)
```
hotel: { name, checkInTime, checkOutTime, cancellationPolicy, breakfast, amenities: [{name, details}] }
rooms: [{ id, name, maxGuests, pricePerNight, description }]
faqs:  [{ question, answer }]
```

**Conversation message** (internal, `conversationStore.js`): `{ role: "user"|"assistant", content: string }`

**Availability result:** `{ checkIn, checkOut, adults, nights, results: [{ roomId, roomName, maxGuests, pricePerNight, nights, totalPrice, available, unitsAvailable }] }`

## AI design

- **LLM is responsible for:** turning retrieved facts + conversation
  history into a natural-language answer; recognizing (per its system
  prompt) when the provided context doesn't actually answer the question.
- **LLM is NOT responsible for:** deciding intent, retrieving facts,
  validating dates/guest counts, or computing availability. Those are all
  plain deterministic functions the LLM never touches — `checkAvailability`
  is called directly by the route handler, and its output is inserted into
  the response as-is.
- **Hallucination prevention:** (1) retrieval is a hard gate — if no
  knowledge-base chunk matches, the LLM is skipped entirely and a fixed
  fallback string is returned; (2) when the LLM is called, its system
  prompt restricts it to only the retrieved context and instructs it to
  say it doesn't know rather than guess; (3) availability numbers never
  pass through the LLM at all.
- **Unsupported questions:** routed to the same fallback as "no retrieval
  match" — guest sees a clear "I don't have that information" message
  instead of a fabricated answer.
- **Failure handling:** an LLM API error is caught and the guest still
  gets the raw retrieved facts as a plain-language fallback, rather than a
  broken chat turn.
