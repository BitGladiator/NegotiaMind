import React, { useEffect, useRef } from "react";

export default function Transcript({ transcript }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  return (
    <div style={{
      flex: 1,
      overflowY: "auto",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      justifyContent: transcript ? "flex-start" : "center",
      alignItems: transcript ? "flex-start" : "center",
    }}>
      {transcript ? (
        <p style={{
          fontFamily: "var(--font-sans)",
          fontSize: "14px",
          color: "var(--text-primary)",
          lineHeight: "1.7",
          animation: "fade-in 0.3s ease",
        }}>
          {transcript}
        </p>
      ) : (
        <p style={{
          color: "var(--text-muted)",
          fontSize: "13px",
          textAlign: "center",
          lineHeight: "1.6",
        }}>
          Press the mic to capture the<br />buyer's speech in real time
        </p>
      )}
      <div ref={bottomRef} />
    </div>
  );
}