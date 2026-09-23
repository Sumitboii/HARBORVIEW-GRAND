const { retrieve } = require("../services/retrievalService");
const { detectIntent } = require("../services/intentService");

describe("retrievalService.retrieve", () => {
  test("finds relevant chunks for a check-in question", () => {
    const results = retrieve("What time is check-in?");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].text.toLowerCase()).toContain("check-in");
  });

  test("returns nothing for an unrelated query", () => {
    const results = retrieve("What is the capital of France?");
    expect(results.length).toBe(0);
  });
});

describe("intentService.detectIntent", () => {
  test("classifies a plain FAQ as a general question", () => {
    expect(detectIntent("Is breakfast included?")).toBe("general_question");
  });

  test("classifies an availability question with dates as availability", () => {
    expect(detectIntent("Do you have rooms available 2027-01-10 for 2 guests?")).toBe("availability");
  });

  test("classifies a vague availability mention as needing details", () => {
    expect(detectIntent("Can I book a room?")).toBe("availability_needs_details");
  });

  test("respects an explicit availability payload regardless of message text", () => {
    expect(detectIntent("hello", { checkIn: "2027-01-10" })).toBe("availability");
  });
});
