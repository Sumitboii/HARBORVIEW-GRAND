# Harborview Grand — Full-Stack AI Hotel Guest Assistant
## Complete Project Report & Documentation

**Developer:** Sumit Kumar Singh  
**Assignment:** Build a Full-Stack AI-Powered Hotel Guest Assistant  
**Repository:** [github.com/Sumitboii/HARBORVIEW-GRAND](https://github.com/Sumitboii/HARBORVIEW-GRAND)  
**Live Demo:** [harborview-grand.onrender.com](https://harborview-grand.onrender.com)

---

## Table of Contents

1. [Assignment Overview](#1-assignment-overview)
2. [What Was Built](#2-what-was-built)
3. [Tech Stack — What, Why & How](#3-tech-stack--what-why--how)
4. [Project Structure](#4-project-structure)
5. [Architecture & Data Flow](#5-architecture--data-flow)
6. [Backend Deep Dive](#6-backend-deep-dive)
7. [Frontend Deep Dive](#7-frontend-deep-dive)
8. [AI Integration](#8-ai-integration)
9. [Knowledge Base](#9-knowledge-base)
10. [API Reference](#10-api-reference)
11. [Test Coverage](#11-test-coverage)
12. [Assignment Completion Checklist](#12-assignment-completion-checklist)
13. [Design Decisions & Trade-offs](#13-design-decisions--trade-offs)
14. [How to Run Locally](#14-how-to-run-locally)

---

## 1. Assignment Overview

The assignment required building a full-stack AI-powered **Hotel Guest Assistant** — a chat interface where hotel guests can:

- Ask natural-language questions about hotel policies, amenities, rooms, and services
- Check live room availability using a structured date/guest form
- Have multi-turn conversations with context carried across messages
- Get grounded, hallucination-free answers from a hotel knowledge base

### Required Questions to Handle (from the assignment spec)

| # | Question | Type |
|---|---|---|
| 1 | What time is check-in? | FAQ / Policy |
| 2 | Does the hotel have a swimming pool? | Amenity |
| 3 | Which room is suitable for three guests? | Room Info |
| 4 | Is breakfast included? | Policy |
| 5 | What is the cancellation policy? | Policy |
| 6 | Do you have rooms available for a given date? | Availability |

All six are implemented and tested.

---

## 2. What Was Built

### Harborview Grand — AI Concierge System

A two-panel luxury hotel assistant with a **left sidebar** showing hotel info (fully clickable and interactive) and a **right chat area** powered by AI.

#### Key Features Delivered
- **Natural language Q&A** — Guests type any question, the system retrieves relevant hotel knowledge and generates a natural response
- **Room availability checker** — Structured form for check-in/check-out dates and guest count; returns real-time per-room inventory
- **Multi-turn conversation** — Conversation ID maintained across messages; follow-up questions use prior context
- **Hallucination prevention** — LLM is grounded strictly in retrieved facts; availability numbers never pass through the LLM
- **Graceful fallbacks** — Works without any API key (knowledge-base fallback mode); handles API errors silently
- **Intent detection** — Keywords and patterns route messages to the correct handler before any LLM call
- **Interactive sidebar** — Every section (hotel schedule, dining, amenities, contact) triggers a chat query when clicked
- **Hydration-safe UI** — React SSR/client timestamp mismatch resolved with `suppressHydrationWarning` and `useEffect`-based time injection
- **Deployed on Render** — Backend and frontend deployed as separate services via `render.yaml` Blueprint

---

## 3. Tech Stack — What, Why & How

### Backend

| Technology | What it is | Why it was chosen | How it's used |
|---|---|---|---|
| **Node.js** | JavaScript runtime | Matches frontend language, fast I/O for API calls | Runs the Express server |
| **Express.js** | Web framework | Minimal, fast; single endpoint doesn't need a heavy framework | Handles `POST /api/chat`, `GET /api/health`, 404/500 error handling |
| **dotenv** | Env variable loader | Standard way to manage secrets without hardcoding | Loads `GEMINI_API_KEY`, `PORT` from `.env` |
| **cors** | CORS middleware | Required for browser→API cross-origin requests | Configured with allowlist (localhost + Render frontend URL) |
| **Google Gemini API** | LLM (AI model) | Provides natural-language answer generation; free tier available | Called in `llmService.js` for general questions; falls back to KB mode if unavailable |
| **Jest** | Test runner | Industry standard for Node.js; built-in assertions | Runs 27 tests across 3 suites |
| **Supertest** | HTTP test client | Tests Express routes without starting a real server | Used in `chat.test.js` for integration tests |

### Frontend

| Technology | What it is | Why it was chosen | How it's used |
|---|---|---|---|
| **Next.js 14** | React framework | Explicitly preferred by the assignment brief; SSR + fast HMR | App entry point, page routing, production builds |
| **React 18** | UI library | Industry standard component model | All UI components (`ChatWindow`, `MessageBubble`, `AvailabilityForm`) |
| **CSS (globals.css)** | Styling | No extra dependencies needed; full control over layout | Two-column hotel layout, luxury brass/cream/navy palette, animations |
| **Playwright** | E2E testing | Official Next.js E2E test tool; browser-level testing | 4 end-to-end scenarios covering full user flows |
| **Google Fonts (Cinzel, Plus Jakarta Sans)** | Typography | Cinzel = luxury serif for hotel branding; Jakarta Sans = clean readable body | Hotel name, developer card, headings |

### Infrastructure

| Technology | What it is | Why it was chosen | How it's used |
|---|---|---|---|
| **GitHub** | Version control | Standard; required for Render deployment | Source of truth; auto-deploy triggers |
| **Render** | Cloud hosting | Free tier, supports Node.js natively, Blueprint YAML deploy | Two separate services: API + frontend |
| **render.yaml** | Infrastructure-as-code | Declarative service configuration; one-click deploy | Defines both services, env vars, build/start commands |

---

## 4. Project Structure

```
hotel-assistant/
│
├── backend/                         # Express API
│   ├── src/
│   │   ├── app.js                   # Express app factory, CORS, error handlers
│   │   ├── server.js                # Server entry point (binds PORT)
│   │   ├── routes/
│   │   │   └── chat.js              # POST /api/chat route — intent routing hub
│   │   ├── services/
│   │   │   ├── intentService.js     # Keyword/regex intent classifier
│   │   │   ├── retrievalService.js  # TF-IDF keyword retrieval from KB
│   │   │   ├── llmService.js        # Gemini API calls + KB fallback
│   │   │   ├── availabilityService.js # Deterministic room inventory check
│   │   │   └── conversationStore.js # In-memory conversation history (last 10 turns)
│   │   ├── data/
│   │   │   └── knowledgeBase.json   # Hotel facts: rooms, policies, amenities, FAQs
│   │   └── __tests__/
│   │       ├── chat.test.js         # 12 API integration tests
│   │       ├── availabilityService.test.js  # 12 unit tests
│   │       └── retrieval_intent.test.js     # 3 intent/retrieval unit tests
│   ├── .env.example                 # Template for environment variables
│   └── package.json
│
├── frontend/                        # Next.js app
│   ├── pages/
│   │   ├── _app.js                  # Global CSS import
│   │   └── index.js                 # Main page — two-column layout, sidebar handlers
│   ├── components/
│   │   ├── ChatWindow.js            # Chat state, message sending, forwardRef API
│   │   ├── MessageBubble.js         # Individual message renderer (text/availability/typing)
│   │   └── AvailabilityForm.js      # Date picker + guest count form + results display
│   ├── styles/
│   │   └── globals.css              # All styles — layout, sidebar, chat, animations
│   ├── tests/
│   │   └── e2e.spec.js              # 4 Playwright end-to-end tests
│   ├── .env.example                 # NEXT_PUBLIC_BACKEND_URL template
│   └── package.json
│
├── docs/
│   ├── ARCHITECTURE.md              # API contract, data flow, AI design decisions
│   ├── REQUIREMENTS.md              # Full requirement matrix with IDs and evidence
│   ├── TEST_PLAN.md                 # 16 test scenarios with observed results
│   └── REQUIREMENT_AUDIT.md        # Final PASS/FAIL audit against each requirement
│
├── .gitignore                       # Excludes node_modules, .env, .next, build artefacts
├── render.yaml                      # Render Blueprint — deploys both services
└── README.md                        # Quick-start, API examples, product notes
```

---

## 5. Architecture & Data Flow

```
Browser (Next.js)              Backend (Express)                Gemini API
┌──────────────────┐  HTTPS   ┌────────────────────────┐       ┌───────────┐
│  Sidebar (index) │          │  POST /api/chat         │──────▶│  Gemini   │
│  ChatWindow      │─────────▶│  ↓ intentService        │       │  (optional│
│  AvailabilityForm│          │  ↓ retrievalService     │◀──────│   key)    │
│  MessageBubble   │◀─────────│  ↓ llmService           │       └───────────┘
└──────────────────┘  JSON    │  ↓ availabilityService  │
                              │  ↓ conversationStore    │
                              └──────────┬──────────────┘
                                         │
                              knowledgeBase.json (hotel data)
```

### Request Lifecycle (Step by Step)

1. **Guest submits message** via chat input or clicks a sidebar shortcut
2. **Frontend sends** `POST /api/chat` with `{ message, conversationId? }`
3. **Backend validates** — empty message returns `400 INVALID_REQUEST`
4. **Intent detection** — `intentService.detectIntent()` classifies the message:
   - `greeting` → "Welcome" reply (no LLM call)
   - `gratitude` → "You're welcome" reply (no LLM call)
   - `booking_request` → Booking acknowledgement using conversation context
   - `availability` → Route to availability handler (if dates provided)
   - `availability_needs_details` → Ask guest for check-in/check-out/guests
   - `general_question` → Retrieve + LLM path
5. **Retrieval** — `retrievalService.retrieve()` scores every KB chunk against the question by keyword overlap; top chunks selected
6. **LLM call** — `llmService.callLLM()` sends question + context to Gemini; if no API key or rate limit hit → falls back silently to `mockAnswer()` from KB facts
7. **Conversation stored** — Turn appended to in-memory store keyed by `conversationId`
8. **Structured response** returned → Frontend renders as bubble or availability card

---

## 6. Backend Deep Dive

### `intentService.js` — Intent Classification

Uses keyword/regex pattern matching — no AI needed for this step. Patterns include:

| Intent | Triggers |
|---|---|
| `greeting` | hi, hello, hey, good morning/evening |
| `gratitude` | thank you, thanks, great, awesome |
| `booking_request` | book, reserve, I want a room |
| `availability` | check availability + dates present in message |
| `availability_needs_details` | availability mentioned but no dates |
| `general_question` | everything else |

**Why keyword-based?** Intent is binary and structured — "is this an availability request?" doesn't need AI. Using regex makes it deterministic, fast, and unit-testable.

### `retrievalService.js` — Knowledge Base Retrieval

Implements **TF-IDF-style keyword overlap scoring**:

1. Tokenises the guest's question into lowercase words
2. Scores each KB chunk by how many question words appear in it
3. Returns top-N chunks above a similarity threshold

**Why not embeddings?** The KB has ~15 facts. Embeddings would add a vector DB, an extra API call, and model dependency for zero real accuracy gain at this scale. Keyword overlap is transparent, fast, and passes unit tests reliably.

### `llmService.js` — Gemini Integration + Fallback

```
callLLM(question, contextChunks, conversationHistory)
 ├── Builds system prompt: "Answer ONLY from this hotel data: {context}"
 ├── Includes last 10 conversation turns as message history
 ├── Calls Gemini API (models/gemini-2.0-flash)
 ├── On 429/503/network error → falls back to mockAnswer(question, contextChunks)
 └── Returns { text, usedFallback, source }
```

**Hallucination prevention:**
- System prompt explicitly restricts model to provided context
- If retrieval returns no matching chunks → LLM is **skipped entirely**
- Availability numbers never pass through the LLM

### `availabilityService.js` — Room Inventory

Fully deterministic — no AI involved:
- Validates: `checkIn < checkOut`, `adults ≥ 1`, dates are valid ISO strings
- Computes nights as `(checkOut - checkIn) / 86400000`
- Returns deterministic inventory seeded from room data (same input always = same output)
- Room types: Standard Queen ($149), Deluxe King ($189), Triple Room ($219), Family Suite ($279)

### `conversationStore.js` — Multi-turn Context

Simple in-memory Map: `conversationId → [{ role, content }]`. Keeps last 10 turns per conversation. Resets on server restart (intentional — demo scope).

### `chat.js` — Route Handler

The central hub:
```
POST /api/chat
  → validate input
  → detectIntent
  → if greeting/gratitude → immediate reply
  → if availability (with dates) → validateAvailabilityRequest → checkAvailability
  → if availability_needs_details → prompt form
  → if general_question → retrieve → callLLM
  → logRequest (structured JSON log)
  → storeConversationTurn
  → return structured response
```

---

## 7. Frontend Deep Dive

### `pages/index.js` — Layout & Sidebar

Two-column layout:
- **Left (300px sidebar):** Pinned header (hotel brand + online status) + scrollable sections + pinned developer card footer
- **Right (flex-1 chat):** Header with status pill + `ChatWindow` + footer credit

Every sidebar item calls `chatRef.current.sendMessage(query)` or `chatRef.current.openAvailability()` — wired via `useRef` + `forwardRef` + `useImperativeHandle`.

### `ChatWindow.js` — Chat State Machine

Exported as `forwardRef` with imperative handle exposing:
- `sendMessage(text)` — used by sidebar shortcuts
- `openAvailability()` — used by "Check Live Room Availability" button
- `toggleAvailability()` — toggle the availability form

Key state:
- `messages[]` — all chat bubbles
- `conversationId` — persisted across sends
- `loading` — shows typing indicator
- `showAvailabilityForm` — toggles inline form
- `availableQuestions[]` — suggested chips (removed after used)

**Hydration fix:** Welcome message `time` starts as `null` (SSR renders nothing); patched to `getTimeString()` in `useEffect` after client mounts. `suppressHydrationWarning` added to all timestamp spans. This eliminates the Next.js SSR/client locale mismatch error.

### `MessageBubble.js` — Message Renderer

Handles four message kinds:
| Kind | Renders |
|---|---|
| `text` | Standard chat bubble (user right, assistant left) |
| `typing` | Animated three-dot loading indicator |
| `availability` | Results card with per-room pricing |
| `error` | Red error bubble with "Unable to connect" header |

### `AvailabilityForm.js` — Date & Guest Form

- Three labeled inputs: check-in date, check-out date, number of adults
- Client-side validation before submitting to backend
- On success renders `AvailabilityResults` — per-room cards showing name, capacity, price/night, total, and availability status (green "X Available" or red "Sold Out")

### `globals.css` — Design System

Custom CSS with brass/cream/navy luxury hotel aesthetic:

| Variable | Value | Used for |
|---|---|---|
| `--brass` | `#9E742C` | Accents, borders, interactive highlights |
| `--ink` | `#1B2A41` | Primary text |
| `--cream` | `#F8F6F0` | Page background |
| `--panel` | `#FFFFFF` | Sidebar, bubbles |
| `--serif` | Cinzel | Hotel name, developer card, schedule times |
| `--sans` | Plus Jakarta Sans | All body text |

Key layout rules:
- `.hotel-layout` — `max-width: 1060px`, `height: min(88vh, 760px)` — fits screens without being massive
- `.hotel-sidebar` — `300px` fixed width, flex column with pinned header + scrollable body + pinned footer
- `.sidebar-header` — `flex-shrink: 0` — hotel brand + online status always visible regardless of scroll
- `.sidebar-footer` — `flex-shrink: 0` — developer card always visible at the bottom

---

## 8. AI Integration

### Model Used
**Google Gemini 2.0 Flash** (`models/gemini-2.0-flash`) via the Gemini REST API.

**Why Gemini?**
- Free tier available (20 req/day)
- Strong instruction-following — essential for grounding responses to only the provided context
- Fast response times for a chat interface

### How the LLM is Used (and Not Used)

| Task | AI Used? | Why |
|---|---|---|
| Intent detection | ❌ No | Deterministic; regex is faster and testable |
| Knowledge base retrieval | ❌ No | Keyword overlap; DB-scale doesn't need vectors |
| Date/guest validation | ❌ No | Pure arithmetic |
| Room availability calculation | ❌ No | Deterministic business logic |
| Natural-language answer generation | ✅ Yes | Only task requiring fluent prose |
| Availability number formatting | ❌ No | Structured data inserted directly |

### Grounding System Prompt

```
You are a helpful hotel concierge for Harborview Grand.
Answer ONLY using the following hotel information. If the answer 
cannot be found in the provided information, say you don't have 
that information rather than guessing.

Hotel Information:
{retrieved knowledge-base chunks}

Keep your answer concise, friendly, and professional.
```

### Fallback Chain
```
Guest question
  → Retrieve KB chunks
  → If no chunks match → return fixed "I don't have that information" message (no LLM)
  → If chunks found → call Gemini API
    → If Gemini succeeds → return LLM response
    → If Gemini fails (429/503/timeout) → return mockAnswer() from KB chunks directly
```

The guest always gets an answer. The LLM failure is silent.

---

## 9. Knowledge Base

Stored in `backend/src/data/knowledgeBase.json`. Structure:

```json
{
  "hotel": {
    "name": "Harborview Grand",
    "checkInTime": "3:00 PM",
    "checkOutTime": "11:00 AM",
    "cancellationPolicy": "Free cancellation up to 48 hours before check-in...",
    "breakfast": "A complimentary continental breakfast is included...",
    "amenities": [
      { "name": "Outdoor Heated Pool", "details": "Open 7:00 AM–9:00 PM, 2nd floor terrace" },
      { "name": "Waterfront Spa & Wellness Pavilion", "details": "..." },
      { "name": "The Harbor Room", "details": "Breakfast daily 7:00 AM–10:30 AM" },
      { "name": "The Terrace Lounge & Bar", "details": "Cocktails 4:00 PM–11:00 PM, ocean view" }
    ]
  },
  "rooms": [
    { "id": "standard-queen", "name": "Standard Queen", "maxGuests": 2, "pricePerNight": 149, "description": "..." },
    { "id": "deluxe-king",    "name": "Deluxe King",    "maxGuests": 2, "pricePerNight": 189, "description": "..." },
    { "id": "triple-room",    "name": "Triple Room",    "maxGuests": 3, "pricePerNight": 219, "description": "..." },
    { "id": "family-suite",   "name": "Family Suite",   "maxGuests": 4, "pricePerNight": 279, "description": "..." }
  ],
  "faqs": [
    { "question": "What is the cancellation policy?", "answer": "..." },
    { "question": "Is there parking?",               "answer": "..." }
  ]
}
```

---

## 10. API Reference

### `POST /api/chat`

**Request body:**
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

**Response — General answer:**
```json
{
  "conversationId": "uuid",
  "type": "answer",
  "reply": "Check-in is at 3:00 PM.",
  "meta": { "usedFallback": false, "source": "gemini" }
}
```

**Response — Availability results:**
```json
{
  "conversationId": "uuid",
  "type": "availability",
  "reply": "Here's what I found for 2 night(s), 2 guest(s):",
  "availability": {
    "checkIn": "2027-03-01",
    "checkOut": "2027-03-03",
    "adults": 2,
    "nights": 2,
    "results": [
      {
        "roomId": "standard-queen",
        "roomName": "Standard Queen",
        "maxGuests": 2,
        "pricePerNight": 149,
        "nights": 2,
        "totalPrice": 298,
        "available": true,
        "unitsAvailable": 2
      }
    ]
  }
}
```

**Response — Availability validation error:**
```json
{
  "conversationId": "uuid",
  "type": "availability_error",
  "reply": "I need a bit more information: checkOut must be after checkIn.",
  "errors": ["checkOut must be after checkIn."]
}
```

**Response — Malformed request (400):**
```json
{ "error": { "code": "INVALID_REQUEST", "message": "`message` is required and must be a non-empty string." } }
```

### `GET /api/health`
```json
{ "status": "ok" }
```

---

## 11. Test Coverage

### Backend — Jest (27/27 passing)

| Suite | Tests | What's Covered |
|---|---|---|
| `chat.test.js` | 12 | Full API integration: FAQ answers, follow-ups, availability, validation, fallbacks, 404, 500 |
| `availabilityService.test.js` | 12 | Room results, night calculation, validation edge cases, determinism |
| `retrieval_intent.test.js` | 3 | Intent detection, KB retrieval scoring |

### Frontend — Playwright (4/4 passing)

| Test | What's Covered |
|---|---|
| Load the chat interface | Page renders, welcome message visible, suggested chips present |
| Send a message and receive a response | Full round-trip to backend, response bubble appears |
| Show availability form | Clicking "Do you have rooms available for a given date?" shows the date form |
| Handle error state gracefully | Error bubble shown when backend is unreachable |

### Manual Test Scenarios (All Pass)

| Scenario | Result |
|---|---|
| All 6 required questions answered | ✅ Pass |
| Typing indicator during loading | ✅ Pass |
| Follow-up questions use conversation context | ✅ Pass |
| Invalid dates rejected with clear message | ✅ Pass |
| Out-of-scope question (weather on Mars) | ✅ Fallback, no hallucination |
| Backend offline — frontend error bubble | ✅ Pass |
| Page refresh — no hydration error | ✅ Pass |

---

## 12. Assignment Completion Checklist

| Requirement | Status | Evidence |
|---|---|---|
| Chat UI for hotel questions | ✅ **Complete** | `pages/index.js`, `ChatWindow.js` |
| All 6 required sample questions handled | ✅ **Complete** | Sidebar chips + backend intent routing |
| Room availability form (dates + guests) | ✅ **Complete** | `AvailabilityForm.js` |
| Availability results displayed per room | ✅ **Complete** | `AvailabilityResults` in `AvailabilityForm.js` |
| Multi-turn conversation context | ✅ **Complete** | `conversationStore.js`, `conversationId` |
| LLM integration (Gemini) | ✅ **Complete** | `llmService.js` |
| Knowledge base (hotel facts) | ✅ **Complete** | `knowledgeBase.json` |
| Grounded answers (no hallucination) | ✅ **Complete** | System prompt + retrieval gate + no-LLM-for-availability |
| Fallback for unsupported questions | ✅ **Complete** | `FALLBACK_MESSAGE` path in `llmService.js` |
| Loading/error states in UI | ✅ **Complete** | Typing bubble + error bubble |
| Backend API with clean JSON shape | ✅ **Complete** | `POST /api/chat` documented contract |
| Automated backend tests (27) | ✅ **Complete** | `npm test` → 27/27 |
| Playwright E2E tests (4) | ✅ **Complete** | `npm run test:e2e` → 4/4 |
| README with setup instructions | ✅ **Complete** | `README.md` |
| Architecture documentation | ✅ **Complete** | `docs/ARCHITECTURE.md` |
| Test plan with scenarios | ✅ **Complete** | `docs/TEST_PLAN.md` |
| Requirement audit | ✅ **Complete** | `docs/REQUIREMENT_AUDIT.md` |
| GitHub repository | ✅ **Complete** | [Sumitboii/HARBORVIEW-GRAND](https://github.com/Sumitboii/HARBORVIEW-GRAND) |
| Deployed live | ✅ **Complete** | [harborview-grand.onrender.com](https://harborview-grand.onrender.com) |

### Intentionally Out of Scope (as stated in brief)
| Item | Reason |
|---|---|
| Real booking/payment | Brief asks for availability only, not booking |
| Persistent DB (conversations) | Demo-scale; in-memory is sufficient; noted as production gap |
| Embedding-based retrieval | KB is 15 facts; keyword overlap is more transparent and testable |
| Auth / rate limiting | Optional in brief; time-boxed assignment |

**Assignment completion: 100% of required deliverables implemented and tested.**

---

## 13. Design Decisions & Trade-offs

### Why Two-Column Layout?
A sidebar with hotel info + chat panel mirrors real hotel concierge apps. It keeps hotel context always visible while the chat stays focused. Each sidebar item is clickable and triggers a chat query — reducing friction for common questions.

### Why Keep Availability Deterministic?
AI models can hallucinate numbers. A guest making a booking decision based on wrong room availability would be a serious UX failure. The availability check is a pure function: same input always gives same output. The LLM never sees or touches inventory numbers.

### Why Keyword Retrieval instead of Embeddings?
The knowledge base has ~15 facts. Vector embeddings would add:
- A vector database
- An extra API call per query
- A model dependency for embedding generation

For 15 facts, keyword overlap is faster, cheaper, fully deterministic, and passes unit tests reliably. At production scale with hundreds of KB entries, embeddings would become necessary.

### Why In-Memory Conversation Store?
A real DB would require schema migrations, connection management, and deployment setup for what is fundamentally a demo-scale project. The trade-off is explicit in the README: conversations reset on server restart, which is acceptable for the assignment.

### Why Gemini Instead of another LLM?
Gemini 2.0 Flash has a free tier (20 requests/day), strong instruction following, and fast latency. The app works without any API key at all via KB fallback mode — so graders and reviewers can run the full app with zero credentials.

### Why suppressHydrationWarning for Timestamps?
Next.js SSR (Node.js) and browser both call `toLocaleTimeString()` but return different case formatting (`am` vs `AM`) due to locale differences between environments. Rather than disabling SSR for the whole component or using a heavy workaround, `suppressHydrationWarning` on the timestamp `<span>` is the React-recommended minimal solution for dynamic time displays.

---

## 14. How to Run Locally

### Prerequisites
- Node.js 18+
- npm

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Optional: add GEMINI_API_KEY=your_key to .env
npm run dev        # http://localhost:4000
```

### Frontend (second terminal)
```bash
cd frontend
npm install
cp .env.example .env   # sets NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
npm run dev             # http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) and start chatting.

### Run Tests
```bash
# Backend (27 tests)
cd backend && npm test

# Frontend E2E (4 tests) — requires both servers running
cd frontend && npm run test:e2e
```

### Environment Variables

**Backend (`.env`):**
```
PORT=4000
GEMINI_API_KEY=your_gemini_api_key_here    # Optional — app works without it
GEMINI_LLM_MODEL=models/gemini-2.0-flash
ALLOWED_ORIGIN=http://localhost:3000
```

**Frontend (`.env`):**
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

---

*Designed & Developed by **Sumit Kumar Singh** — Full-Stack AI Solutions · Harborview Grand Concierge System*
