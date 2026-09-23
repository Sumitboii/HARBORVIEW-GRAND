import { useState } from "react";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function AvailabilityForm({ onSubmit, onCancel, submitting }) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [clientError, setClientError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!checkIn || !checkOut) {
      setClientError("Please choose both a check-in and check-out date.");
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      setClientError("Check-out must be after check-in.");
      return;
    }
    if (!adults || adults < 1) {
      setClientError("Please enter at least 1 guest.");
      return;
    }
    setClientError(null);
    onSubmit({ checkIn, checkOut, adults: Number(adults) });
  };

  return (
    <form className="availability-form" onSubmit={handleSubmit} aria-label="Check room availability">
      <div className="form-header">
        <span className="form-title">Room Availability</span>
        <span className="form-hint">Direct rates &amp; live inventory</span>
      </div>
      <div className="fields-grid">
        <div className="field">
          <label htmlFor="checkIn">Check-in date</label>
          <input
            id="checkIn"
            aria-label="Check-in date"
            type="date"
            min={todayISO()}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="checkOut">Check-out date</label>
          <input
            id="checkOut"
            aria-label="Check-out date"
            type="date"
            min={checkIn || todayISO()}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="adults">Number of adults</label>
          <input
            id="adults"
            aria-label="Number of adults"
            type="number"
            min={1}
            max={10}
            value={adults}
            onChange={(e) => setAdults(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="action-btn primary" disabled={submitting}>
          {submitting ? "Checking availability..." : "Check availability"}
        </button>
        <button type="button" className="action-btn secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
      {clientError && <div className="form-error">{clientError}</div>}
    </form>
  );
}

export function AvailabilityResults({ availability }) {
  if (!availability) return null;
  const { checkIn, checkOut, adults, nights, results } = availability;
  return (
    <div className="availability-card">
      <div className="card-stay-summary">
        <span className="stay-dates">{checkIn} — {checkOut}</span>
        <span className="stay-meta">
          <strong>{nights}</strong> night{nights === 1 ? "" : "s"} &middot; <strong>{adults}</strong> guest{adults === 1 ? "" : "s"}
        </span>
      </div>
      {results.length === 0 ? (
        <div className="no-rooms-notice">
          No room types match that party size. Please try different dates or fewer guests.
        </div>
      ) : (
        <div className="rooms-list">
          {results.map((r) => (
            <div className={`room-row ${r.available ? "is-available" : "is-soldout"}`} key={r.roomId}>
              <div className="room-info">
                <div className="room-name-wrapper">
                  <span className="room-name">{r.roomName}</span>
                </div>
                <div className="room-specs">
                  <span>Capacity: Up to {r.maxGuests} guests</span>
                  <span>&middot;</span>
                  <span>${r.pricePerNight} / night</span>
                  <span>&middot;</span>
                  <strong className="room-total">${r.totalPrice} total</strong>
                </div>
              </div>
              <div className="room-status-badge">
                <span className={`tag ${r.available ? "available" : "unavailable"}`}>
                  {r.available ? `${r.unitsAvailable} Available` : "Sold Out"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
