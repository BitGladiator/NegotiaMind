import { useEffect, useRef, useCallback } from "react";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000/stream";
const RECONNECT_DELAY_MS = 3000;

export function useWebSocket({ onMessage, onStatusChange }) {
  const wsRef         = useRef(null);
  const sessionIdRef  = useRef(null);
  const reconnectRef  = useRef(null);
  const mountedRef    = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const url = sessionIdRef.current
      ? `${WS_URL}?sessionId=${sessionIdRef.current}`
      : WS_URL;

    const ws = new WebSocket(url);
    wsRef.current = ws;
    onStatusChange("connecting");

    ws.onopen = () => {
      console.log("WebSocket connected");
      onStatusChange("connected");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        // Save sessionId for reconnection
        if (msg.sessionId) sessionIdRef.current = msg.sessionId;

        onMessage(msg);
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    ws.onclose = () => {
      console.warn("🔌 WebSocket closed — reconnecting...");
      onStatusChange("reconnecting");
      if (mountedRef.current) {
        reconnectRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };

    ws.onerror = (err) => {
      console.error("WS error:", err);
      onStatusChange("error");
    };
  }, [onMessage, onStatusChange]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  // Send binary audio chunk
  const sendAudio = useCallback((chunk) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(chunk);
    }
  }, []);

  // Send control message
  const sendControl = useCallback((type) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type }));
    }
  }, []);

  return { sendAudio, sendControl };
}