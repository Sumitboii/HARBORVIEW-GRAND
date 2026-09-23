# Test Plan & Results

Automated backend tests: `cd backend && npm test` → **27/27 passing**
(3 suites: `chat.test.js`, `availabilityService.test.js`,
`retrieval_intent.test.js`). Frontend scenarios below were run manually
against the running backend + `npm run dev` frontend, since the assignment
scope didn't call for a frontend test runner.

| Test ID | Requirement(s) | Input | Expected behavior | Observed result | Pass/Fail |
|---|---|---|---|---|---|
| TEST-01 | REQ-001, REQ-032 | "What time is check-in?" | Answer grounded in KB check-in time | Reply contains "3:00 PM" | **Pass** |
| TEST-02 | REQ-001, REQ-032 | "Does the hotel have a swimming pool?" | Answer about the pool | Reply mentions "pool" | **Pass** |
| TEST-03 | REQ-001, REQ-032 | "Which room is suitable for three guests?" | Suggests Triple Room or Family Suite | Reply matches `/triple|family/` | **Pass** |
| TEST-04 | REQ-040 | `message: ""` | Rejected as malformed | `400 INVALID_REQUEST` | **Pass** |
| TEST-05 | REQ-005, REQ-037 | "What's the weather like on Mars?" | No hallucination, clear fallback | `meta.usedFallback: true` | **Pass** |
| TEST-06 | REQ-002, REQ-038 | Two messages, same `conversationId` | Second reply keeps the same conversation ID | `conversationId` matches across both calls | **Pass** |
| TEST-07 | REQ-003, REQ-034, REQ-036 | Valid `availability` payload | Deterministic per-room results, correct night count | `type: "availability"`, `nights: 2`, results array present | **Pass** |
| TEST-08 | REQ-040 | `checkOut` before `checkIn` | Rejected with specific message | `type: "availability_error"`, non-empty `errors` | **Pass** |
| TEST-09 | REQ-040 | `adults: 0` | Rejected with specific message | `type: "availability_error"` | **Pass** |
| TEST-10 | REQ-004 | "Do you have any rooms available?" (no dates/guests) | Asks for missing details instead of guessing | `type: "availability_needs_details"` | **Pass** |
| TEST-11 | REQ-002, REQ-003, REQ-050 | Question → follow-up → availability, one `conversationId` | Full flow works, ID stable throughout | All three responses share `conversationId`; last is `type: "availability"` | **Pass** |
| TEST-12 | (health) | `GET /api/health` | Liveness check | `200 { status: "ok" }` | **Pass** |
| TEST-13 | REQ-040 | `GET /api/does-not-exist` | Structured 404 | `404 { error: { code: "NOT_FOUND" } }` | **Pass** |
| TEST-14 | REQ-034, REQ-036 | `checkAvailability` called twice with identical inputs | Deterministic, repeatable output (no AI randomness) | Two calls produce identical results (`toEqual`) | **Pass** |
| TEST-15 (frontend, manual) | REQ-013 | Send a message | Typing indicator shown while awaiting response | Animated typing bubble visible during the request | **Pass** (manual) |
| TEST-16 (frontend, manual) | REQ-014 | Stop the backend, send a message | Frontend shows a graceful error state, not a crash | Red error bubble: "I couldn't reach the assistant service…" | **Pass** (manual) |

## Coverage against the assignment's required categories
- Normal FAQ — TEST-01, TEST-02
- Room information — TEST-03
- Missing information — TEST-04, TEST-10
- Ambiguous question — TEST-10 (availability mentioned with no details)
- Availability/tool-calling — TEST-07, TEST-14
- Invalid dates / invalid guest count — TEST-08, TEST-09
- Unsupported question — TEST-05
- Conversation follow-ups — TEST-06, TEST-11
- Frontend loading state — TEST-15
- Frontend/backend error state — TEST-16
- End-to-end flow — TEST-11 (backend), manually verified in the browser against the live frontend + backend
