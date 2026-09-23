# Requirement Audit

Every requirement from `docs/REQUIREMENTS.md`, audited against actual
implementation + test evidence. `npm test` in `backend/` was run and passed
27/27 before this audit was written.

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| REQ-001 | Ask a hotel question | **PASS** | `chat.js` general-question path; TEST-01/02/03 |
| REQ-002 | Follow-up in same conversation | **PASS** | `conversationStore.js`; TEST-06, TEST-11 |
| REQ-003 | Request room availability | **PASS** | `availabilityService.js`; TEST-07 |
| REQ-004 | Detect availability intent from free text | **PASS** | `intentService.js`; retrieval_intent.test.js |
| REQ-005 | Fallback on unsupported questions | **PASS** | `llmService.js` FALLBACK_MESSAGE; TEST-05 |
| REQ-010–018 | Frontend chat UI, loading/error states, availability form, responsive | **PASS** | `frontend/components/*`, `globals.css`; manual TEST-15/16, `next build` succeeds |
| REQ-019 | Frontend never calls the LLM directly | **PASS** | Code review — only `fetch(BACKEND_URL + "/api/chat")` in frontend code |
| REQ-020 | No API keys in frontend | **PASS** | Code review — `ANTHROPIC_API_KEY` only referenced in `backend/src/services/llmService.js` |
| REQ-030 | API accepts question + context | **PASS** | `POST /api/chat`; chat.test.js |
| REQ-031 | Hotel knowledge base | **PASS** | `knowledgeBase.json` |
| REQ-032 | Answers from KB data | **PASS** | `retrievalService.js` + `llmService.js`; TEST-01/02/03 |
| REQ-033 | Identify availability requests | **PASS** | `intentService.js`; retrieval_intent.test.js |
| REQ-034 | Mock `checkAvailability` tool | **PASS** | `availabilityService.checkAvailability`; availabilityService.test.js |
| REQ-035 | Uses an LLM where appropriate | **PASS** | `llmService.callLLM` (real call when `ANTHROPIC_API_KEY` set; mock otherwise) |
| REQ-036 | Deterministic logic outside the LLM | **PASS** | Availability/validation/intent/retrieval are plain functions; availabilityService.test.js |
| REQ-037 | Clear fallback when unreliable | **PASS** | TEST-05 |
| REQ-038 | Conversation context maintained | **PASS** | `conversationStore.js`; TEST-06/11 |
| REQ-039 | Structured API responses | **PASS** | Consistent `{conversationId, type, reply, ...}` shape, documented in `docs/ARCHITECTURE.md` |
| REQ-040 | Validation, error handling, logging | **PASS** | `validateAvailabilityRequest`, central error handler in `app.js`, `logRequest`; TEST-04/08/09/13 |
| REQ-041 | Automated tests for backend flows | **PASS** | 27 tests across 3 suites, `npm test` |
| REQ-050 | Frontend + backend work as one flow | **PASS** | Manual run: browser → Next.js → Express → response rendered; TEST-11 covers the backend half |
| REQ-060–066 | Documentation deliverables | **PASS** | `README.md`, `docs/ARCHITECTURE.md`, `docs/TEST_PLAN.md`, `KIRO_PROMPT.md` |
| REQ-070 | Time-boxed, not production-perfect | **PASS** | Scope deliberately kept small (in-memory store, keyword retrieval); gaps listed explicitly in README |

## Not implemented / explicitly out of scope
- **Real booking/payment** — the brief only asks for availability checking, not booking; not built.
- **Persistent storage** (DB for conversations/knowledge base) — in-memory only, called out in README as a production gap.
- **Embedding-based retrieval** — keyword overlap only; adequate for the small KB size, noted as a future improvement.
- **Auth / rate limiting / deployed demo URL** — optional in the brief; not built given the 6–8 hour target.
- **Frontend automated tests** (e.g. Playwright/RTL) — frontend behavior verified manually (TEST-15/16) and via a successful `next build`; not required to be automated by the brief, but noted as a gap.

No requirement from the assignment was silently skipped — everything above
that isn't a PASS is explicitly called out as descoped, with the reason.
