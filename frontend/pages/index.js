import { useRef } from "react";
import Head from "next/head";
import { ChatWindow } from "../components/ChatWindow";

export default function Home() {
  const chatRef = useRef(null);

  const handleSidebarQuery = (query) => {
    if (chatRef.current) {
      chatRef.current.sendMessage(query);
    }
  };

  const handleOpenAvailability = () => {
    if (chatRef.current) {
      chatRef.current.openAvailability();
    }
  };

  return (
    <div className="app-container">
      <Head>
        <title>Harborview Grand — AI Guest Concierge</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="hotel-layout">
        {/* Left Information Sidebar */}
        <aside className="hotel-sidebar" aria-label="Hotel Quick Guide">
          {/* Constant Top Brand & Status Section */}
          <div className="sidebar-header">
            <div className="sidebar-brand">
              <div className="hotel-crest">HG</div>
              <div>
                <h1 className="hotel-name">HARBORVIEW GRAND</h1>
                <p className="hotel-type">Waterfront Resort &amp; Spa</p>
              </div>
            </div>

            <div className="sidebar-status">
              <span className="status-dot"></span>
              <span className="status-text">AI Concierge Online</span>
            </div>
          </div>

          {/* Scrollable Middle Content */}
          <div className="sidebar-scroll-content">
            {/* Hotel Schedule (Clickable) */}
            <div className="sidebar-section">
              <div className="section-header">
                <span className="sidebar-label">Hotel Schedule</span>
                <span className="click-hint">Click to ask</span>
              </div>
              <button
                type="button"
                className="interactive-card schedule-card"
                onClick={() => handleSidebarQuery("What time is check-in and check-out?")}
                title="Click to ask about check-in and check-out"
              >
                <div className="schedule-item">
                  <span className="schedule-title">Check-in</span>
                  <span className="schedule-time">3:00 PM</span>
                </div>
                <div className="schedule-divider" />
                <div className="schedule-item">
                  <span className="schedule-title">Check-out</span>
                  <span className="schedule-time">11:00 AM</span>
                </div>
              </button>
            </div>

            {/* Quick Room Availability Action */}
            <div className="sidebar-section">
              <div className="section-header">
                <span className="sidebar-label">Room Reservations</span>
              </div>
              <button
                type="button"
                className="sidebar-action-btn"
                onClick={handleOpenAvailability}
              >
                Check Live Room Availability
              </button>
            </div>

            {/* Dining & Lounges (Clickable) */}
            <div className="sidebar-section">
              <div className="section-header">
                <span className="sidebar-label">Dining &amp; Lounges</span>
                <span className="click-hint">Click to ask</span>
              </div>
              <div className="dining-list">
                <button
                  type="button"
                  className="interactive-card dining-item"
                  onClick={() => handleSidebarQuery("Is breakfast included?")}
                  title="Click to ask about breakfast"
                >
                  <div className="dining-header">
                    <span className="dining-name">The Harbor Room</span>
                    <span className="dining-tag">Breakfast</span>
                  </div>
                  <span className="dining-hours">Daily: 7:00 AM — 10:30 AM (Complimentary)</span>
                </button>

                <button
                  type="button"
                  className="interactive-card dining-item"
                  onClick={() => handleSidebarQuery("Tell me about the Terrace Lounge & Bar")}
                  title="Click to ask about the lounge"
                >
                  <div className="dining-header">
                    <span className="dining-name">The Terrace Lounge &amp; Bar</span>
                    <span className="dining-tag">Cocktails</span>
                  </div>
                  <span className="dining-hours">Daily: 4:00 PM — 11:00 PM (Ocean View)</span>
                </button>
              </div>
            </div>

            {/* Resort Amenities (Clickable) */}
            <div className="sidebar-section">
              <div className="section-header">
                <span className="sidebar-label">Resort Amenities</span>
                <span className="click-hint">Click to ask</span>
              </div>
              <div className="amenities-buttons">
                <button
                  type="button"
                  className="interactive-amenity-btn"
                  onClick={() => handleSidebarQuery("Does the hotel have a swimming pool?")}
                >
                  <span className="amenity-bullet">—</span>
                  <span>Outdoor Heated Pool (7 AM–9 PM)</span>
                </button>
                <button
                  type="button"
                  className="interactive-amenity-btn"
                  onClick={() => handleSidebarQuery("What spa and wellness services do you offer?")}
                >
                  <span className="amenity-bullet">—</span>
                  <span>Waterfront Spa &amp; Wellness Pavilion</span>
                </button>
                <button
                  type="button"
                  className="interactive-amenity-btn"
                  onClick={() => handleSidebarQuery("What is the Wi-Fi policy?")}
                >
                  <span className="amenity-bullet">—</span>
                  <span>Complimentary High-Speed Wi-Fi</span>
                </button>
                <button
                  type="button"
                  className="interactive-amenity-btn"
                  onClick={() => handleSidebarQuery("Do you offer valet parking?")}
                >
                  <span className="amenity-bullet">—</span>
                  <span>Valet Parking &amp; 24/7 Concierge</span>
                </button>
              </div>
            </div>

            {/* Location & Contact */}
            <div className="sidebar-section">
              <div className="section-header">
                <span className="sidebar-label">Location &amp; Contact</span>
              </div>
              <button
                type="button"
                className="interactive-card contact-card"
                onClick={() => handleSidebarQuery("How can I contact the front desk?")}
                title="Click to ask about contact info"
              >
                <div className="contact-row">
                  <span className="contact-label">Address:</span>
                  <span className="contact-val">100 Harborview Drive</span>
                </div>
                <div className="contact-row">
                  <span className="contact-label">Front Desk:</span>
                  <span className="contact-val">+1 (555) 019-2834</span>
                </div>
              </button>
            </div>
          </div>{/* end sidebar-scroll-content */}

          {/* Developer Card — pinned at bottom, always visible */}
          <div className="sidebar-footer">
            <div className="developer-card">
              <div className="dev-accent-bar" />
              <div className="dev-header">
                <span className="dev-tagline">Designed &amp; Developed By</span>
              </div>
              <div className="dev-name">Sumit Kumar Singh</div>
              <div className="dev-role">Full-Stack AI Solutions &middot; Harborview Concierge</div>
            </div>
          </div>
        </aside>

        {/* Right Concierge Chat Area */}
        <main className="chat-main">
          <header className="chat-header">
            <div className="chat-header-info">
              <h2>AI Guest Assistant</h2>
              <p>Ask about hotel policies, amenities, or check live room availability</p>
            </div>
            <div className="header-status-pill">
              <span className="status-dot"></span>
              <span>24/7 Available</span>
            </div>
          </header>

          <ChatWindow ref={chatRef} />

          <footer className="chat-footer">
            <span>Designed &amp; Developed by <strong className="footer-author">Sumit Kumar Singh</strong> &middot; Harborview Grand Concierge System</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
