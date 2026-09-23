# Requirements, Acceptance Criteria & Use Cases

All requirements below come directly from the assignment brief. Each has an
ID, why it's needed, how it's implemented, how it's tested, and its
acceptance criteria.

## Functional / conversation requirements

| ID | Requirement | Why | Implementation | Test | Acceptance criteria |
|----|---|---|---|---|---|
| REQ-001 | Guest can ask a hotel question via chat | Core value prop | `ChatWindow` + `POST /api/chat` | chat.test.js TEST-01/02/03 | Guest types a question, sees an answer grounded in hotel data |
| REQ-002 | Guest can ask a follow-up in the same conversation | Real conversations aren't one-shot | `conversationId` + `conversationStore.js` | chat.test.js TEST-06, TEST-11 | Second message with same `conversationId` returns a coherent reply and the same ID |
| REQ-003 | Guest can request room availability | Listed example question | `availability` payload + `availabilityService.js` | chat.test.js TEST-07 | Valid dates/guests return per-room results |
| REQ-004 | System detects availability intent from free text | Guest may not use the form | `intentService.detectIntent` | retrieval_intent.test.js | Keyword+date phrasing routes to availability; vague phrasing asks for details |
| REQ-005 | Unsupported/out-of-scope questions get a clear fallback, not a guess | Prevent hallucination | `llmService` fallback path | chat.test.js TEST-05 | `usedFallback: true`, no invented facts |

## Frontend requirements

| ID | Requirement | Implementation | Test |
|----|---|---|---|
| REQ-010 | Clean chat/conversational interface | `pages/index.js`, `ChatWindow.js`, `globals.css` | Manual + build check |
| REQ-011 | Guest can enter/submit questions | `<form className="composer">` in `ChatWindow.js` | Manual |
| REQ-012 | Messages and responses displayed clearly, distinguishable by sender | `MessageBubble.js` (`.bubble.user` / `.bubble.assistant`) | Manual |
| REQ-013 | Loading state visible while waiting | `loading` state → typing-indicator bubble | Manual |
| REQ-014 | API/AI failure state displayed gracefully | `kind: "error"` bubble on fetch failure/non-2xx | Manual (see TEST-15/16 in test plan) |
| REQ-015 | Follow-up questions supported in one thread | Same `messages` array + `conversationId` | Manual + TEST-06 |
| REQ-016 | Usable way to collect check-in, check-out, guest count | `AvailabilityForm.js` (date pickers + number input, client-side validation) | Manual |
| REQ-017 | Availability results displayed clearly | `AvailabilityResults` component (per-room cards) | Manual |
| REQ-018 | Reasonably responsive desktop/mobile | CSS max-width layout + `@media (max-width: 520px)` rules | Manual |
| REQ-019 | Frontend calls backend only, never the LLM directly | All calls go to `NEXT_PUBLIC_BACKEND_URL/api/chat`; no LLM SDK/key in frontend | Code review |
| REQ-020 | No API keys/sensitive config in frontend code | `ANTHROPIC_API_KEY` only read server-side in `backend/src/services/llmService.js` | Code review |

## Backend requirements

| ID | Requirement | Implementation | Test |
|----|---|---|---|
| REQ-030 | API accepts guest questions + conversation context | `POST /api/chat` (`message`, `conversationId`) | chat.test.js |
| REQ-031 | Small hotel knowledge base (JSON/DB) | `backend/src/data/knowledgeBase.json` | retrieval_intent.test.js |
| REQ-032 | Answers property/room/amenity/policy/FAQ questions from that data | `retrievalService.js` + `llmService.js` | chat.test.js TEST-01/02/03 |
| REQ-033 | Identifies availability requests | `intentService.js` | retrieval_intent.test.js |
| REQ-034 | Calls a mock `checkAvailability(checkIn, checkOut, adults)` tool | `availabilityService.checkAvailability` | availabilityService.test.js |
| REQ-035 | Uses an LLM where appropriate | `llmService.callLLM` (Anthropic Messages API, mock fallback without a key) | chat.test.js (via `meta.source`) |
| REQ-036 | Deterministic business logic kept outside the LLM | Availability + validation + intent + retrieval are all plain functions, not LLM calls | availabilityService.test.js, retrieval_intent.test.js |
| REQ-037 | Clear fallback when an answer can't be reliably determined | `FALLBACK_MESSAGE` in `llmService.js`, returned when retrieval finds nothing | chat.test.js TEST-05 |
| REQ-038 | Maintains basic conversation context | `conversationStore.js` (in-memory, last 10 turns) | chat.test.js TEST-06/11 |
| REQ-039 | Clean, structured API responses | Consistent `{ conversationId, type, reply, ... }` shape; see `docs/ARCHITECTURE.md` | chat.test.js (assertions on `res.body.type`) |
| REQ-040 | Basic validation, error handling, logging | `validateAvailabilityRequest`, central error handler in `app.js`, `logRequest` in `chat.js` | chat.test.js TEST-04, TEST-08, TEST-09 |
| REQ-041 | Meaningful automated tests for important backend flows | `backend/src/__tests__/*.test.js` (27 tests) | `npm test` |

## Integration requirement

| ID | Requirement | Implementation | Test |
|----|---|---|---|
| REQ-050 | Frontend + backend work together as one usable flow | `NEXT_PUBLIC_BACKEND_URL` fetch from `ChatWindow.js` to the Express API | Manual E2E run + chat.test.js TEST-11 (backend half) |

## Documentation & deliverables

| ID | Requirement | Status |
|----|---|---|
| REQ-060 | README with setup/run instructions | `README.md` |
| REQ-061 | Architecture explanation (frontend, backend, AI, data flow) | `docs/ARCHITECTURE.md` |
| REQ-062 | Backend API examples (curl) | `README.md` |
| REQ-063 | Product/UX/engineering/AI decisions note | `README.md` ("Product & engineering notes") |
| REQ-064 | Evaluation/test scenarios + observed results | `docs/TEST_PLAN.md` |
| REQ-065 | List of AI tools used | `README.md` |
| REQ-066 | Kiro-ready spec-first prompt | `KIRO_PROMPT.md` |

## Constraints

| ID | Constraint | How respected |
|----|---|---|
| REQ-070 | ~6–8 hours of focused effort, not production-perfect | Small, in-memory conversation store; keyword retrieval instead of embeddings; no auth/rate-limiting — all called out explicitly as future work rather than built |

---

## User journeys / use cases

| # | Input | System behavior | Expected response | Error/fallback | Test |
|---|---|---|---|---|---|
| UC-1 | "What time is check-in?" | Retrieve matching KB chunk(s) → LLM (or mock) phrases answer | Grounded answer mentioning 3:00 PM | — | TEST-01 |
| UC-2 | Follow-up "And check-out?" with same `conversationId` | History included in LLM context | Coherent follow-up answer, same conversation ID | — | TEST-06 |
| UC-3 | Availability form: valid dates + guests | `checkAvailability` (deterministic) | Per-room availability list | — | TEST-07 |
| UC-4 | Availability form: checkOut before checkIn, or 0 guests | `validateAvailabilityRequest` rejects | `type: "availability_error"` with specific messages | Frontend shows the form again with the error | TEST-08, TEST-09 |
| UC-5 | "What's the weather like on Mars?" | Retrieval finds nothing | Fixed fallback message, `usedFallback: true` | No hallucinated answer | TEST-05 |
| UC-6 | LLM API call throws (network/API error) | `callLLM` catch block | Reply built directly from retrieved facts, `source: "llm_error"` | Guest still gets an answer, not a hard failure | Code path in `llmService.js`; verified by inspection (see audit) |
| UC-7 | Availability service throws unexpectedly | Route-level `try/catch` in `chat.js` | `500` with structured `{ error: { code, message } }` | Frontend shows an error bubble | Code path in `chat.js`; covered by 404/central-error-handler tests as the same mechanism |
| UC-8 | Frontend can't reach backend (offline/CORS/down) | `fetch` throws in `ChatWindow.js` | Red error bubble with a plain-language message | Guest can retry by sending another message | Manual (see TEST-16 in test plan) |
