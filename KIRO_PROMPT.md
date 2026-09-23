# Prompt for Kiro — Full-Stack AI-Powered Hotel Guest Assistant

Paste everything below this line into Kiro as your task/spec prompt.

---

## Role

You are acting as a senior full-stack engineer following a **spec-first, requirements-driven development process**. Do not write implementation code until the spec phases below are complete and I have confirmed them.

## The Assignment (source of truth for requirements)

**Scenario:** A hotel wants an AI-powered guest assistant on its website. Guests should be able to ask questions about the property and check room availability through a simple web interface.

Typical questions:
- What time is check-in?
- Does the hotel have a swimming pool?
- Which room is suitable for three guests?
- Is breakfast included?
- What is the cancellation policy?
- Do you have rooms available for a given date?

### Frontend requirements
- Simple guest-facing web app. React/Next.js preferred (equivalent modern framework acceptable).
- Clean chat/conversational interface.
- Guest can enter and submit questions.
- Guest messages and assistant responses displayed clearly.
- Loading/processing state visible while waiting for a response.
- API/AI failure states handled and displayed gracefully.
- Follow-up questions supported within the same conversation.
- A usable way to collect check-in date, check-out date, and number of guests for availability requests.
- Availability results displayed clearly.
- Reasonably responsive on desktop and mobile.
- Frontend calls the backend only — never the LLM directly from the browser.
- No API keys or sensitive config exposed in frontend code.

### Backend requirements
- API that accepts guest questions and conversation context.
- Small hotel knowledge base (JSON or DB).
- Answers property/room/amenity/policy/FAQ questions from that data.
- Detects when a guest is asking about availability.
- For availability, calls a mock tool/function such as `checkAvailability(checkIn, checkOut, adults)`.
- Uses an LLM/AI model where appropriate.
- Keeps deterministic business logic (availability, validation) outside the LLM.
- Returns a clear fallback response when an answer can't be reliably determined from available data.
- Maintains basic conversation context.
- Clean, structured API responses.
- Basic validation, error handling, and logging.
- Meaningful automated tests for important backend flows.

### Integration
End-to-end flow: open app → ask a hotel question → frontend calls backend → AI response displayed → ask a follow-up → check availability → see a useful error/fallback on failure.

### AI + product thinking to explain in the writeup
- What customer problem is being solved.
- The guest journey.
- Why the frontend experience is designed the way it is.
- Which parts use AI vs. stay deterministic, and why.
- What can go wrong with the AI response, and how hallucinations/unsupported answers are prevented.
- What happens when the model, an API call, or another dependency fails.
- How you'd measure whether the feature is actually useful.
- What you'd improve before shipping to production.

### Evaluation & testing
At least 8–10 meaningful test/evaluation scenarios covering: normal questions, missing information, ambiguous questions, availability/tool-calling, unsupported assumptions, follow-ups, frontend loading/error states, backend/model failure/fallback, and at least one end-to-end flow.

### Deliverables
- GitHub repo with frontend + backend source.
- README with setup/run instructions.
- Short architecture explanation (frontend, backend, AI/model, data flow).
- Working frontend runnable locally.
- Backend API examples (curl/Postman).
- Short note on product, UX, engineering, AI decisions.
- Evaluation/test scenarios and observed results.
- List of AI tools used.
- Optional: deployed demo URL or screen recording.

### Constraints
- Target ~6–8 focused hours of effort — not a production-perfect app.
- Prioritize clear thinking, design, and integration over polish.
- Must be able to explain and defend every technical/product decision.

---

## Required Process (do not skip or reorder)

Work through these phases, **in this exact order**, and show me the output of each phase before moving to implementation:

1. **Understand the assignment** — extract every requirement into a checklist with unique IDs (`REQ-001`, `REQ-002`, ...), grouped into: functional, frontend, backend, AI/LLM, availability, conversation/context, validation, error/fallback, testing, documentation, deliverables, constraints, time expectations. Do not invent requirements not present in the assignment. For each: requirement, why it's needed, how it'll be implemented, how it'll be tested, acceptance criteria.

2. **Acceptance criteria** — convert every important requirement into measurable, testable acceptance criteria.

3. **User journeys / use cases** — at minimum: normal hotel question; follow-up question; availability request; invalid availability info; question not in the knowledge base; LLM/API failure; availability service failure; frontend/backend communication failure. For each: input, system behavior, expected response, error/fallback behavior, acceptance criteria, test case.

4. **Architecture design** — high-level architecture, component/frontend/backend/AI architecture, data flow, API design, knowledge retrieval design, availability flow, error-handling strategy, testing strategy. Justify every technology choice; don't introduce anything unnecessary.

5. **API contract** — for every endpoint: method, URL, request schema, response schema, validation rules, HTTP status codes, error response shape, example request, example response. Frontend and backend must follow the same contract.

6. **Data contract** — typed schemas for: hotel knowledge base, room info, availability response, chat request, chat response, conversation messages, errors.

7. **AI design** — what the LLM is/isn't responsible for; how hotel info is retrieved; how context is passed to the LLM; how hallucinations are prevented; how unsupported questions are handled; how intent is determined; how availability requests are routed to deterministic logic. **The LLM must never invent availability — that's deterministic backend logic only.**

8. **Test plan** — map requirement → acceptance criteria → test case, at least 10 tests covering: normal FAQ, room info, amenity question, missing info, ambiguous question, follow-up, availability request, invalid dates, invalid guest count, unsupported question, LLM failure, availability failure, backend failure, frontend loading state, frontend error state, end-to-end flow. Each test needs an ID, requirement covered, input, expected behavior/result, pass/fail criteria.

9. **Implementation plan** — small, ordered steps (repo structure → knowledge base → backend models → availability service → chat API → retrieval → LLM service → frontend → integration → tests → fixes → documentation).

**Stop here and wait for my confirmation before writing implementation code.**

Once confirmed, implement in small verified steps: one component at a time, checked against requirements/contracts, tests run after each major piece, no untested code accumulated. Maintain a requirement traceability matrix (Requirement | Design | Implementation | Test | Status). At the end: run all tests, fix every issue found, then produce a final requirement-by-requirement audit (PASS / NOT IMPLEMENTED, each PASS backed by implementation + test evidence). Finish with a plain-language explanation of the architecture, API design, AI flow, retrieval, availability logic, error handling, testing, trade-offs, and what you'd improve — written so I can defend it in an interview.
