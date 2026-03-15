import React from "react";


export default function MicButton({ status, onClick }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>

      {/* Outer pulse wrapper */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>

        {/* Pulse ring — only visible when recording */}
        {status === "recording" && (
          <>
            <div style={{
              position: "absolute",
              width: "90px", height: "90px",
              borderRadius: "50%",
              background: "var(--red)",
              animation: "pulse-ring 1.2s ease-out infinite",
              opacity: 0.3,
            }} />
            <div style={{
              position: "absolute",
              width: "90px", height: "90px",
              borderRadius: "50%",
              background: "var(--red)",
              animation: "pulse-ring 1.2s ease-out infinite 0.4s",
              opacity: 0.2,
            }} />
          </>
        )}

        
        <button
          onClick={onClick}
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            border: `2px solid ${getBorderColor(status)}`,
            background: getBgColor(status),
            cursor: status === "processing" ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            transition: "all 0.2s ease",
            outline: "none",
          }}
          disabled={status === "processing"}
        >
          {status === "processing" ? (
            // Spinner
            <div style={{
              width: "24px", height: "24px",
              border: "2px solid var(--yellow)",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
          ) : (
            // Mic icon
            <MicIcon color={getIconColor(status)} />
          )}
        </button>
      </div>

      {/* Label */}
      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        letterSpacing: "0.1em",
        color: getLabelColor(status),
        animation: status === "recording" ? "pulse-dot 1.5s ease-in-out infinite" : "none",
      }}>
        {getLabel(status)}
      </span>
    </div>
  );
}

function MicIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="9"  y1="22" x2="15" y2="22" />
    </svg>
  );
}

function getBgColor(status) {
  switch (status) {
    case "recording":  return "var(--red-dim)";
    case "processing": return "var(--yellow-dim)";
    case "error":      return "var(--red-dim)";
    default:           return "var(--bg-elevated)";
  }
}
function getBorderColor(status) {
  switch (status) {
    case "recording":  return "var(--red)";
    case "processing": return "var(--yellow)";
    case "error":      return "var(--red)";
    default:           return "var(--border)";
  }
}
function getIconColor(status) {
  switch (status) {
    case "recording": return "var(--red)";
    case "error":     return "var(--red)";
    default:          return "var(--text-secondary)";
  }
}
function getLabelColor(status) {
  switch (status) {
    case "recording":  return "var(--red)";
    case "processing": return "var(--yellow)";
    case "error":      return "var(--red)";
    default:           return "var(--text-muted)";
  }
}
function getLabel(status) {
  switch (status) {
    case "recording":   return "● LISTENING";
    case "processing":  return "PROCESSING";
    case "error":       return "ERROR";
    default:            return "TAP TO LISTEN";
  }
}