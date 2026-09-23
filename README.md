# Harborview Grand — AI Guest Concierge

A full-stack hotel guest assistant: a two-panel chat interface where guests ask natural-language questions about the hotel and check live room availability, powered by Google Gemini and grounded in a structured knowledge base.

**Live demo:** [harborview-grand.onrender.com](https://harborview-grand.onrender.com)  
**Developer:** Sumit Kumar Singh

---

## What it does

- Answers hotel questions in natural language (check-in times, amenities, policies, room types)
- Checks room availability via a structured date/guest-count form
- Maintains multi-turn conversation context across messages
- Falls back gracefully when the LLM is unavailable — answers are served directly from the knowledge base
- Prevents hallucination: availability numbers never pass through the LLM

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, CSS |
| Backend | Node.js, Express |
| AI | Google Gemini 2.0 Flash (REST API) |
| Knowledge base | JSON flat file |
| Tests | Jest + Supertest (27), Playwright E2E (4) |
| Hosting | Render (Blueprint deploy via `render.yaml`) |

---

## Quick start

**Backend**
```bash
cd backend
npm install
cp .env.example .env        # add GEMINI_API_KEY if you have one (optional)
npm run dev                  # http://localhost:4000
```

**Frontend** (second terminal)
```bash
cd frontend
npm install
cp .env.example .env         # sets NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
npm run dev                  # http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) and start chatting.

### Running without an API key

The app runs fully without `GEMINI_API_KEY` — it falls back to a grounded knowledge-base mode that answers directly from verified hotel data. Add a real key in `backend/.env` to get Gemini-generated responses.

---

## Environment variables

**`backend/.env`**
```
PORT=4000
GEMINI_API_KEY=your_key_here          # optional
GEMINI_LLM_MODEL=models/gemini-2.0-flash
ALLOWED_ORIGIN=http://localhost:3000  # set to your frontend URL in production
```

**`frontend/.env`**
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

---

## Tests

```bash
# Backend — 27 unit + integration tests
cd backend && npm test

# Frontend — 4 Playwright E2E tests (requires both servers running)
cd frontend && npm run test:e2e
```

---

## API reference

### `POST /api/chat`

```bash
# General question
curl -s -X POST https://harborview-grand-api.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What time is check-in?"}'

# Follow-up (pass conversationId from previous response)
curl -s -X POST https://harborview-grand-api.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"And check-out?","conversationId":"<id>"}'

# Availability check
curl -s -X POST https://harborview-grand-api.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"availability":{"checkIn":"2027-06-01","checkOut":"2027-06-03","adults":2}}'
```

**Response shape**
```json
{
  "conversationId": "uuid",
  "type": "answer",
  "reply": "Check-in is at 3:00 PM.",
  "meta": { "usedFallback": false, "source": "gemini" }
}
```

### `GET /api/health`
```json
{ "status": "ok" }
```

---

## Project structure

```
hotel-assistant/
├── backend/
│   ├── src/
│   │   ├── app.js                   # Express factory, CORS, error handlers
│   │   ├── server.js                # Entry point
│   │   ├── routes/chat.js           # POST /api/chat — intent routing hub
│   │   ├── services/
│   │   │   ├── intentService.js     # Keyword/regex intent classifier
│   │   │   ├── retrievalService.js  # Keyword-overlap KB retrieval
│   │   │   ├── llmService.js        # Gemini API + KB fallback
│   │   │   ├── availabilityService.js
│   │   │   └── conversationStore.js # In-memory multi-turn context
│   │   └── data/knowledgeBase.json  # Hotel facts
│   └── package.json
├── frontend/
│   ├── pages/index.js               # Two-column layout + sidebar handlers
│   ├── components/
│   │   ├── ChatWindow.js
│   │   ├── MessageBubble.js
│   │   └── AvailabilityForm.js
│   └── styles/globals.css
├── docs/
│   ├── PROJECT_REPORT.md
│   ├── ARCHITECTURE.md
│   ├── REQUIREMENTS.md
│   ├── TEST_PLAN.md
│   └── REQUIREMENT_AUDIT.md
├── render.yaml                      # Render Blueprint (deploys both services)
└── README.md
```

---

## Deployment

The project deploys automatically to Render via `render.yaml` Blueprint.  
Two services are created: `harborview-grand-api` (backend) and `harborview-grand` (frontend).

Set `GEMINI_API_KEY` in the Render dashboard under the backend service's environment variables.

---

## Documentation

| File | Contents |
|---|---|
| `docs/PROJECT_REPORT.md` | Full project report — architecture, decisions, test results |
| `docs/ARCHITECTURE.md` | API contract, data flow, AI design |
| `docs/REQUIREMENTS.md` | Requirement matrix with IDs and evidence |
| `docs/TEST_PLAN.md` | 16 test scenarios with observed results |
| `docs/REQUIREMENT_AUDIT.md` | Final PASS / out-of-scope audit |

---

*Designed and built by **Sumit Kumar Singh***
