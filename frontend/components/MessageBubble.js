import { AvailabilityResults } from "./AvailabilityForm";

export function MessageBubble({ message }) {
  const { role, kind, text, availability, time } = message;

  if (kind === "typing") {
    return (
      <div className="bubble-row assistant">
        <div className="avatar assistant">C</div>
        <div className="bubble-container">
          <div className="sender-name">Harborview Concierge</div>
          <div className="bubble assistant typing-bubble">
            <span className="typing">
              <span /> <span /> <span />
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "availability") {
    return (
      <div className="bubble-row assistant">
        <div className="avatar assistant">C</div>
        <div className="bubble-container full-width">
          <div className="sender-name">
            Harborview Concierge {time && <span className="timestamp" suppressHydrationWarning>· {time}</span>}
          </div>
          <div className="bubble assistant availability-response">
            {text && <div className="response-header-text">{text}</div>}
            <AvailabilityResults availability={availability} />
          </div>
        </div>
      </div>
    );
  }

  const renderFormattedText = (content) => {
    if (role !== "assistant" || kind === "error") {
      return content;
    }

    let clean = content;
    if (clean.startsWith("Based on the hotel's information: ")) {
      clean = clean.replace("Based on the hotel's information: ", "");
    }

    const parts = clean.split(" Also: ");
    if (parts.length > 1) {
      return (
        <div className="formatted-answer">
          <div className="primary-fact">{parts[0]}</div>
          {parts.slice(1).map((extra, idx) => (
            <div key={idx} className="secondary-fact">
              <span className="fact-bullet">—</span>
              <span>{extra}</span>
            </div>
          ))}
        </div>
      );
    }

    return clean;
  };

  return (
    <div className={`bubble-row ${role}`}>
      {role === "assistant" && <div className="avatar assistant">C</div>}
      <div className="bubble-container">
        <div className="sender-name">
          {role === "user" ? "You" : "Harborview Concierge"}
          {time && <span className="timestamp" suppressHydrationWarning>· {time}</span>}
        </div>
        <div className={`bubble ${role} ${kind === "error" ? "error" : ""}`}>
          {kind === "error" && (
            <div className="error-header">
              <span className="label">Unable to connect</span>
            </div>
          )}
          {renderFormattedText(text)}
        </div>
      </div>
      {role === "user" && <div className="avatar user">G</div>}
    </div>
  );
}
