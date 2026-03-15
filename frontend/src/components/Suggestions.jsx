import React from "react";

const SENTIMENT_COLORS = {
  positive: { color: "var(--accent)",  bg: "var(--accent-dim)",  label: "Positive" },
  neutral:  { color: "var(--blue)",    bg: "var(--blue-dim)",    label: "Neutral"  },
  tense:    { color: "var(--yellow)",  bg: "var(--yellow-dim)",  label: "Tense"    },
};

export default function Suggestions({ suggestions, sentiment, summary }) {
  const hasSuggestions = suggestions && suggestions.length > 0;

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      padding: "20px",
      gap: "12px",
      overflowY: "auto",
    }}>
      {hasSuggestions ? (
        <>
          {/* Suggestions cards */}
          {suggestions.map((s, i) => (
            <SuggestionCard key={s.id} suggestion={s} index={i} />
          ))}

          {/* Sentiment + summary */}
          <div style={{
            marginTop: "auto",
            paddingTop: "12px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            animation: "fade-in 0.4s ease",
          }}>
            {sentiment && <SentimentBadge sentiment={sentiment} />}
            {summary && (
              <p style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                lineHeight: "1.5",
                fontStyle: "italic",
              }}>
                {summary}
              </p>
            )}
          </div>
        </>
      ) : (
        // Empty state
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
        }}>
          <TargetIcon />
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
            Waiting for conversation input...
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>
            Analysis will appear here
          </p>
        </div>
      )}
    </div>
  );
}

function SuggestionCard({ suggestion, index }) {
  return (
    <div style={{
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "8px",
      padding: "14px",
      animation: `slide-in 0.3s ease ${index * 0.08}s both`,
    }}>
      <div style={{
        fontSize: "10px",
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.08em",
        color: "var(--accent)",
        marginBottom: "6px",
        textTransform: "uppercase",
      }}>
        {suggestion.tactic}
      </div>
      <p style={{
        fontSize: "13px",
        color: "var(--text-primary)",
        lineHeight: "1.6",
      }}>
        {suggestion.text}
      </p>
    </div>
  );
}

function SentimentBadge({ sentiment }) {
  const s = SENTIMENT_COLORS[sentiment] || SENTIMENT_COLORS.neutral;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      padding: "3px 10px",
      borderRadius: "20px",
      background: s.bg,
      color: s.color,
      fontSize: "11px",
      fontFamily: "var(--font-mono)",
      letterSpacing: "0.05em",
      width: "fit-content",
    }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.color }} />
      {s.label}
    </span>
  );
}

function TargetIcon() {
  return (
    <div style={{
      width: "52px", height: "52px",
      borderRadius: "50%",
      background: "var(--bg-elevated)",
      border: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    </div>
  );
}