# Harborview Grand — Hotel Guest Assistant

A small full-stack guest assistant: a chat UI where guests can ask hotel
questions and check room availability.

```
hotel-assistant/
  backend/     Express API: knowledge-base Q&A, intent routing, availability
  frontend/    Next.js chat UI
  docs/        Requirements, architecture, API/data contracts, test plan, audit
  KIRO_PROMPT.md   Ready-to-paste spec-first prompt for Kiro
```

## Quick start

**Backend**
```bash
cd backend
npm install
cp .env.example .env   # optional — see below
npm run dev             # http://localhost:4000
```

**Frontend** (in a second terminal)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev              # http://localhost:3000
```

Open http://localhost:3000, ask a question (e.g. "What time is check-in?"),
then try "Check room availability" for the date/guest form.

### Running without an LLM API key
The backend works out-of-the-box without an API key — it uses a **grounded knowledge-base fallback mode** that answers directly from verified hotel data (flagged in the response as `"source": "mock_llm"`), so the entire application is runnable, demoable, and testable with zero external credentials. You can also configure `GEMINI_API_KEY` (Gemini 3.6 Flash / Gemini API) or `ANTHROPIC_API_KEY` in `backend/.env` for generative responses.

### Tests
```bash
# Backend unit & integration test suite (27 tests)
cd backend
npm test

# Frontend Playwright end-to-end suite (4 scenarios)
cd frontend
npm run test:e2e
```

## API examples

```bash
# General question
curl -s -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What time is check-in?"}'

# Follow-up (reuse conversationId from the previous response)
curl -s -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"And check-out?","conversationId":"<id-from-above>"}'

# Availability
curl -s -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"check availability","availability":{"checkIn":"2027-03-01","checkOut":"2027-03-03","adults":2}}'
```

Full endpoint contract: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Documentation

- [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) — requirements checklist (REQ-IDs) + acceptance criteria + use cases
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — architecture, API contract, data contract, AI design
- [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md) — 16 test scenarios mapped to requirements, with observed results
- [`docs/REQUIREMENT_AUDIT.md`](docs/REQUIREMENT_AUDIT.md) — final PASS / NOT IMPLEMENTED audit

## Product & engineering notes

**Customer problem:** front-desk staff get repeatedly asked the same small set
of questions (check-in time, amenities, policies, "is there a room for us"),
and guests often want an answer outside staffed hours. A guest assistant
answers the repetitive questions instantly and routes availability to a
reliable, non-hallucinating source, freeing staff for things that actually
need a human.

**Guest journey:** land on the page → ask a free-text question → get an
answer grounded in real hotel data → ask a follow-up in the same thread →
decide to check dates → fill a short structured form (not free text, since
dates/guest-count need to be exact) → see availability per room type →
either book off-app (real booking is out of scope) or ask another question.

**Why the frontend looks the way it does:** a single persistent chat thread
(not a multi-page flow) keeps follow-ups natural. Availability uses a
dedicated inline form instead of asking the guest to type dates in prose —
structured input is easier to validate and less error-prone than parsing
free text for dates.

**AI vs. deterministic split:**
- **AI (LLM):** phrasing natural-language answers to general questions,
  grounded strictly in retrieved knowledge-base text; using conversation
  history for follow-ups.
- **Deterministic:** intent detection (keyword/pattern rules), retrieval
  (keyword overlap over the knowledge base), date/guest-count validation,
  and the availability check itself. The LLM never sees or invents
  availability numbers — see `docs/ARCHITECTURE.md` for why.

**What can go wrong with the AI response, and mitigations:**
- *Hallucination* — the system prompt restricts the model to only the
  retrieved context and instructs it to say "I don't know" rather than
  guess; if retrieval finds nothing, the LLM is skipped entirely and a
  fixed fallback message is returned.
- *Wrong retrieval* — keyword overlap can miss paraphrased questions; a
  production version would use embedding-based retrieval.
- *Model/API failure* — wrapped in try/catch; on failure the guest still
  gets the raw retrieved facts instead of a generic error, so a network
  blip doesn't fully block an answer.

**Measuring usefulness (post-launch):** % of questions answered without a
fallback, % of sessions with a follow-up (proxy for the guest trusting the
first answer), thumbs-up/down per answer, and how often "unsupported
question" fallbacks recur (signals gaps in the knowledge base).

**What I'd improve before production:** real embedding-based retrieval;
a real database instead of in-memory conversation state; rate limiting and
auth; a real PMS integration behind `checkAvailability`; streaming responses;
structured logging/observability (tracing, latency, cost per turn);
automated accessibility and E2E (Playwright) tests.

## AI tools used

Claude (Anthropic) was used to design and implement this project end-to-end,
including the requirements breakdown, architecture, backend, frontend, and
tests in `docs/`.
