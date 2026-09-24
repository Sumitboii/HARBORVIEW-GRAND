import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { AvailabilityForm } from "./AvailabilityForm";

// If NEXT_PUBLIC_BACKEND_URL is provided, use it; otherwise default to "" in browser (same-origin /api/...) or localhost:4000 in local dev
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL !== undefined
    ? process.env.NEXT_PUBLIC_BACKEND_URL
    : (typeof window !== "undefined" ? "" : "http://localhost:4000");

const INITIAL_QUESTIONS = [
  { id: "checkin", text: "What time is check-in?" },
  { id: "pool", text: "Does the hotel have a swimming pool?" },
  { id: "rooms", text: "Which room is suitable for three guests?" },
  { id: "breakfast", text: "Is breakfast included?" },
  { id: "policy", text: "What is the cancellation policy?" },
  { id: "availability", text: "Do you have rooms available for a given date?" }
];

const getTimeString = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

let idCounter = 1;
const nextId = () => `m-${idCounter++}`;

export const ChatWindow = forwardRef(function ChatWindow(props, ref) {
  const [messages, setMessages] = useState(() => [
    {
      id: "welcome",
      role: "assistant",
      kind: "text",
      time: null, // null during SSR — set client-side via useEffect to avoid locale mismatch
      text: "Welcome to Harborview Grand. How may I assist you today? You may ask about check-in times, amenities, hotel policies, or room availability."
    }
  ]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState(INITIAL_QUESTIONS);
  const listRef = useRef(null);

  // Patch welcome message time client-side only (avoids SSR/client locale mismatch hydration error)
  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) => (m.id === "welcome" && m.time === null ? { ...m, time: getTimeString() } : m))
    );
  }, []);

  useImperativeHandle(ref, () => ({
    sendMessage: (text) => {
      sendMessage(text);
    },
    openAvailability: () => {
      setShowAvailabilityForm(true);
      setAvailableQuestions((prev) => prev.filter((q) => q.id !== "availability"));
    },
    toggleAvailability: () => {
      setShowAvailabilityForm((v) => !v);
    }
  }));

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, loading, showAvailabilityForm]);

  async function postChat(body) {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = data?.error?.message || `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  }

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    const trimmed = text.trim();
    setInput("");
    setShowAvailabilityForm(false);

    setAvailableQuestions((prev) =>
      prev.filter((q) => q.text.toLowerCase() !== trimmed.toLowerCase())
    );

    setMessages((m) => [
      ...m,
      { id: nextId(), role: "user", kind: "text", text: trimmed, time: getTimeString() }
    ]);
    setLoading(true);

    try {
      const data = await postChat({ message: trimmed, conversationId });
      if (data.conversationId) setConversationId(data.conversationId);
      handleServerResponse(data);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: nextId(),
          role: "assistant",
          kind: "error",
          time: getTimeString(),
          text:
            "I couldn't reach the assistant service. Please check your connection and try again." +
            (err.message ? ` (${err.message})` : "")
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function submitAvailability(availability) {
    setLoading(true);
    setShowAvailabilityForm(false);
    setAvailableQuestions((prev) => prev.filter((q) => q.id !== "availability"));

    setMessages((m) => [
      ...m,
      {
        id: nextId(),
        role: "user",
        kind: "text",
        time: getTimeString(),
        text: `Availability request: ${availability.checkIn} to ${availability.checkOut}, ${availability.adults} guest(s)`
      }
    ]);

    try {
      const data = await postChat({ message: "Check room availability", conversationId, availability });
      if (data.conversationId) setConversationId(data.conversationId);
      handleServerResponse(data);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: nextId(),
          role: "assistant",
          kind: "error",
          time: getTimeString(),
          text: "Availability check failed. Please try again." + (err.message ? ` (${err.message})` : "")
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleServerResponse(data) {
    const time = getTimeString();
    if (data.type === "availability") {
      setMessages((m) => [
        ...m,
        { id: nextId(), role: "assistant", kind: "availability", time, text: data.reply, availability: data.availability }
      ]);
    } else if (data.type === "availability_error" || data.type === "availability_needs_details") {
      setMessages((m) => [...m, { id: nextId(), role: "assistant", kind: "text", time, text: data.reply }]);
      setShowAvailabilityForm(true);
    } else {
      setMessages((m) => [...m, { id: nextId(), role: "assistant", kind: "text", time, text: data.reply }]);
    }
  }

  function handleSuggestedClick(qObj) {
    setAvailableQuestions((prev) => prev.filter((item) => item.id !== qObj.id));
    if (qObj.id === "availability") {
      setShowAvailabilityForm((prev) => !prev);
    } else {
      sendMessage(qObj.text);
    }
  }

  function resetSuggestions() {
    setAvailableQuestions(INITIAL_QUESTIONS);
  }

  return (
    <div className="chat">
      <div className="messages" ref={listRef} aria-live="polite">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {loading && <MessageBubble message={{ kind: "typing" }} />}
        {showAvailabilityForm && (
          <div className="bubble-row assistant form-row">
            <div className="avatar assistant">C</div>
            <div className="bubble-container full-width">
              <AvailabilityForm
                submitting={loading}
                onSubmit={submitAvailability}
                onCancel={() => setShowAvailabilityForm(false)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="quick-actions-panel">
        <div className="quick-actions-header">
          <span className="quick-title">
            {availableQuestions.length > 0 ? "Suggested inquiries" : "All popular questions explored"}
          </span>
          {availableQuestions.length < INITIAL_QUESTIONS.length && (
            <button type="button" className="reset-btn" onClick={resetSuggestions}>
              Reset options
            </button>
          )}
        </div>
        <div className="quick-actions">
          {availableQuestions.map((q) => (
            <button
              key={q.id}
              type="button"
              className="action-btn secondary option-chip"
              disabled={loading}
              onClick={() => handleSuggestedClick(q)}
            >
              {q.text}
            </button>
          ))}
        </div>
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
      >
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="Ask about check-in, amenities, policies..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Message"
          />
          <button
            type="submit"
            className="send-btn"
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
});
