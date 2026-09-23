const { validateAvailabilityRequest, checkAvailability } = require("../services/availabilityService");

describe("validateAvailabilityRequest", () => {
  test("valid request passes", () => {
    const { valid, errors } = validateAvailabilityRequest({ checkIn: "2027-01-10", checkOut: "2027-01-12", adults: 2 });
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  test("rejects missing checkIn", () => {
    const { valid, errors } = validateAvailabilityRequest({ checkOut: "2027-01-12", adults: 2 });
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes("checkIn"))).toBe(true);
  });

  test("rejects checkOut before checkIn", () => {
    const { valid } = validateAvailabilityRequest({ checkIn: "2027-01-12", checkOut: "2027-01-10", adults: 2 });
    expect(valid).toBe(false);
  });

  test("rejects zero or negative guests", () => {
    const { valid } = validateAvailabilityRequest({ checkIn: "2027-01-10", checkOut: "2027-01-12", adults: 0 });
    expect(valid).toBe(false);
  });

  test("rejects non-integer guests", () => {
    const { valid } = validateAvailabilityRequest({ checkIn: "2027-01-10", checkOut: "2027-01-12", adults: 2.5 });
    expect(valid).toBe(false);
  });
});

describe("checkAvailability", () => {
  test("returns deterministic, repeatable results for the same inputs", () => {
    const a = checkAvailability("2027-01-10", "2027-01-12", 2);
    const b = checkAvailability("2027-01-10", "2027-01-12", 2);
    expect(a).toEqual(b);
  });

  test("only includes rooms that fit the requested guest count", () => {
    const result = checkAvailability("2027-01-10", "2027-01-12", 4);
    result.results.forEach((r) => expect(r.maxGuests).toBeGreaterThanOrEqual(4));
  });

  test("computes nights and total price correctly", () => {
    const result = checkAvailability("2027-01-10", "2027-01-13", 2);
    expect(result.nights).toBe(3);
    result.results.forEach((r) => expect(r.totalPrice).toBe(r.pricePerNight * 3));
  });
});
