import React, { useState, useCallback, useRef } from "react";
import MicButton from "./components/MicButton.jsx";
import Transcript from "./components/Transcript.jsx";
import Suggestions from "./components/Suggestions.jsx";
import { useWebSocket } from "./hooks/useWebSocket.js";
import { useMicrophone } from "./hooks/useMicrophone.js";

export default function App() {
  const [micStatus, setMicStatus]     = useState("idle"); 
  const [wsStatus, setWsStatus]       = useState("connecting");
  const [transcript, setTranscript]   = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [sentiment, setSentiment]     = useState(null);
  const [summary, setSummary]         = useState("");
  const [textInput, setTextInput]     = useState("");
  const isRecordingRef                = useRef(false);

 
  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case "connected":
        setMicStatus("idle");
        break;
      case "processing":
        setMicStatus("processing");
        break;
      case "transcript":
        setTranscript(msg.text);
        break;
      case "suggestion":
        setTranscript(msg.transcript);
        setSuggestions(msg.suggestions || []);
        setSentiment(msg.sentiment);
        setSummary(msg.summary);
        setMicStatus(isRecordingRef.current ? "recording" : "idle");
        break;
      case "error":
        setMicStatus("error");
        setTimeout(() => setMicStatus("idle"), 2000);
        break;
    }
  }, []);

  const { sendAudio, sendControl } = useWebSocket({
    onMessage: handleMessage,
    onStatusChange: setWsStatus,
  });


  const { start: startMic, stop: stopMic } = useMicrophone({
    onChunk: sendAudio,
    onError: (err) => {
      console.error("Mic error:", err);
      setMicStatus("error");
      setTimeout(() => setMicStatus("idle"), 2000);
    },
  });

  
  const handleMicToggle = () => {
    if (wsStatus !== "connected" && wsStatus !== "connecting") return;

    if (isRecordingRef.current) {
    
      isRecordingRef.current = false;
      stopMic();
      sendControl("end");
      setMicStatus("idle");
    } else {
      isRecordingRef.current = true;
      setMicStatus("recording");
      startMic();
    }
  };

  
  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    setTranscript(textInput.trim());
    setTextInput("");
  };

 
  const statusLabel = {
    connecting:   "CONNECTING",
    connected:    "READY",
    reconnecting: "RECONNECTING",
    error:        "ERROR",
  }[wsStatus] || "CONNECTING";

  const statusColor = {
    connecting:   "var(--yellow)",
    connected:    "var(--accent)",
    reconnecting: "var(--yellow)",
    error:        "var(--red)",
  }[wsStatus] || "var(--yellow)";

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-base)",
      overflow: "hidden",
    }}>

     
      <header style={{
        height: "52px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        flexShrink: 0,
      }}>
    
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "30px", height: "30px",
            borderRadius: "8px",
            background: "var(--accent-dim)",
            border: "1px solid var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "0.02em" }}>
              NegotiaMind
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
              AI NEGOTIATION COACH
            </div>
          </div>
        </div>

      
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <div style={{
            width: "7px", height: "7px",
            borderRadius: "50%",
            background: statusColor,
            boxShadow: `0 0 6px ${statusColor}`,
          }} />
          <span style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.1em",
            color: statusColor,
          }}>
            {statusLabel}
          </span>
        </div>
      </header>

     
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

      
        <div style={{
          width: "55%",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>

         
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border-subtle)",
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            color: "var(--text-muted)",
            flexShrink: 0,
          }}>
            LIVE CONVERSATION
          </div>

         
          <Transcript transcript={transcript} />

         
          <div style={{
            borderTop: "1px solid var(--border)",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
            flexShrink: 0,
            background: "var(--bg-surface)",
          }}>
            <MicButton status={micStatus} onClick={handleMicToggle} />

          
            <div style={{ display: "flex", gap: "8px", width: "100%" }}>
              <input
                type="text"
                placeholder="Or type buyer's message..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
                style={{
                  flex: 1,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  fontFamily: "var(--font-sans)",
                  outline: "none",
                }}
              />
              <button
                onClick={handleTextSubmit}
                style={{
                  width: "36px", height: "36px",
                  borderRadius: "6px",
                  border: "none",
                  background: "var(--accent)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

      
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <Suggestions
            suggestions={suggestions}
            sentiment={sentiment}
            summary={summary}
          />
        </div>
      </div>
    </div>
  );
}