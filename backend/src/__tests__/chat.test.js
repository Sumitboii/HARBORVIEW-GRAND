const request = require("supertest");
const { createApp } = require("../app");

const app = createApp();

describe("POST /api/chat", () => {
  // TEST-01 (REQ: normal FAQ) -------------------------------------------
  test("answers a normal hotel question (check-in time)", async () => {
    const res = await request(app).post("/api/chat").send({ message: "What time is check-in?" });
    expect(res.status).toBe(200);
    expect(res.body.type).toBe("answer");
    expect(res.body.reply.toLowerCase()).toContain("3:00");
  });

  // TEST-02 (REQ: amenity question) --------------------------------------
  test("answers an amenity question (pool)", async () => {
    const res = await request(app).post("/api/chat").send({ message: "Does the hotel have a swimming pool?" });
    expect(res.status).toBe(200);
    expect(res.body.reply.toLowerCase()).toContain("pool");
  });

  // TEST-03 (REQ: room info) ----------------------------------------------
  test("answers a room-for-3-guests question", async () => {
    const res = await request(app).post("/api/chat").send({ message: "Which room is suitable for three guests?" });
    expect(res.status).toBe(200);
    expect(res.body.reply.toLowerCase()).toMatch(/triple|family/);
  });

  // TEST-04 (REQ: missing information / invalid request) ------------------
  test("rejects an empty message", async () => {
    const res = await request(app).post("/api/chat").send({ message: "" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  // TEST-05 (REQ: unsupported question -> fallback, no hallucination) -----
  test("falls back gracefully on an unsupported question", async () => {
    const res = await request(app).post("/api/chat").send({ message: "What's the weather like on Mars?" });
    expect(res.status).toBe(200);
    expect(res.body.meta.usedFallback).toBe(true);
  });

  // TEST-06 (REQ: follow-up / conversation context) ------------------------
  test("supports a follow-up question using the same conversationId", async () => {
    const first = await request(app).post("/api/chat").send({ message: "Is breakfast included?" });
    const convId = first.body.conversationId;
    expect(convId).toBeTruthy();

    const followUp = await request(app)
      .post("/api/chat")
      .send({ message: "What time does it start?", conversationId: convId });

    expect(followUp.status).toBe(200);
    expect(followUp.body.conversationId).toBe(convId);
  });

  // TEST-07 (REQ: availability request -> deterministic tool, not LLM) -----
  test("routes an availability request to the deterministic availability service", async () => {
    const res = await request(app).post("/api/chat").send({
      message: "Do you have rooms available?",
      availability: { checkIn: "2027-01-10", checkOut: "2027-01-12", adults: 2 }
    });
    expect(res.status).toBe(200);
    expect(res.body.type).toBe("availability");
    expect(res.body.availability.nights).toBe(2);
    expect(Array.isArray(res.body.availability.results)).toBe(true);
  });

  // TEST-08 (REQ: invalid dates) --------------------------------------------
  test("rejects availability request with checkOut before checkIn", async () => {
    const res = await request(app).post("/api/chat").send({
      message: "Check availability",
      availability: { checkIn: "2027-01-12", checkOut: "2027-01-10", adults: 2 }
    });
    expect(res.status).toBe(200);
    expect(res.body.type).toBe("availability_error");
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  // TEST-09 (REQ: invalid guest count) ---------------------------------------
  test("rejects availability request with an invalid guest count", async () => {
    const res = await request(app).post("/api/chat").send({
      message: "Check availability",
      availability: { checkIn: "2027-01-10", checkOut: "2027-01-12", adults: 0 }
    });
    expect(res.status).toBe(200);
    expect(res.body.type).toBe("availability_error");
  });

  // TEST-10 (REQ: ambiguous availability question asks for details) ----------
  test("asks for missing details on an ambiguous availability question", async () => {
    const res = await request(app).post("/api/chat").send({ message: "Do you have any rooms available?" });
    expect(res.status).toBe(200);
    expect(res.body.type).toBe("availability_needs_details");
  });

  // TEST-11 (REQ: end-to-end multi-turn flow) ----------------------------------
  test("end-to-end: question -> follow-up -> availability check", async () => {
    const r1 = await request(app).post("/api/chat").send({ message: "What is the cancellation policy?" });
    expect(r1.status).toBe(200);
    const convId = r1.body.conversationId;

    const r2 = await request(app)
      .post("/api/chat")
      .send({ message: "Is breakfast included too?", conversationId: convId });
    expect(r2.status).toBe(200);
    expect(r2.body.conversationId).toBe(convId);

    const r3 = await request(app).post("/api/chat").send({
      message: "Great, check availability",
      conversationId: convId,
      availability: { checkIn: "2027-02-01", checkOut: "2027-02-03", adults: 3 }
    });
    expect(r3.status).toBe(200);
    expect(r3.body.type).toBe("availability");
    expect(r3.body.conversationId).toBe(convId);
  });
});

describe("GET /api/health", () => {
  test("returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("404 handling", () => {
  test("unknown route returns 404 with structured error", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
