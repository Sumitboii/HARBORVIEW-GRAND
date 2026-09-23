const kb = require("../data/knowledgeBase.json");

/**
 * Validates availability request fields. Returns { valid, errors }.
 * Deterministic — no AI involved. This is the single source of truth
 * for whether a set of dates/guest count is well-formed.
 */
function validateAvailabilityRequest({ checkIn, checkOut, adults }) {
  const errors = [];

  const checkInDate = checkIn ? new Date(checkIn) : null;
  const checkOutDate = checkOut ? new Date(checkOut) : null;

  if (!checkIn || isNaN(checkInDate?.getTime())) {
    errors.push("checkIn is required and must be a valid date (YYYY-MM-DD).");
  }
  if (!checkOut || isNaN(checkOutDate?.getTime())) {
    errors.push("checkOut is required and must be a valid date (YYYY-MM-DD).");
  }
  if (checkInDate && checkOutDate && !isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime())) {
    if (checkOutDate <= checkInDate) {
      errors.push("checkOut must be after checkIn.");
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkInDate < today) {
      errors.push("checkIn cannot be in the past.");
    }
  }

  const adultsNum = Number(adults);
  if (adults === undefined || adults === null || adults === "" || !Number.isInteger(adultsNum) || adultsNum < 1) {
    errors.push("adults is required and must be a positive whole number.");
  } else if (adultsNum > 10) {
    errors.push("adults must be 10 or fewer. For larger groups, contact the hotel directly.");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Mock deterministic availability check. In a real system this would query
 * a PMS/booking database. Uses a seeded pseudo-random function so results
 * are stable for the same inputs (useful for tests and demos), and never
 * involves the LLM.
 */
function checkAvailability(checkIn, checkOut, adults) {
  const seedStr = `${checkIn}|${checkOut}|${adults}`;
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  const rand = (n) => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return seed % n;
  };

  const nights = Math.max(
    1,
    Math.round((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
  );

  const eligibleRooms = kb.rooms.filter((r) => r.maxGuests >= Number(adults));

  const results = eligibleRooms.map((room) => {
    const available = rand(10) < 7; // ~70% chance available, deterministic per seed
    const availableUnits = available ? 1 + rand(3) : 0;
    return {
      roomId: room.id,
      roomName: room.name,
      maxGuests: room.maxGuests,
      pricePerNight: room.pricePerNight,
      nights,
      totalPrice: room.pricePerNight * nights,
      available,
      unitsAvailable: availableUnits
    };
  });

  return {
    checkIn,
    checkOut,
    adults: Number(adults),
    nights,
    results
  };
}

module.exports = { validateAvailabilityRequest, checkAvailability };
