const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const { config, validateConfig } = require("../config");
const healthRouter = require("./routes/health");
const sessionManager = require("./utils/sessionManager");

validateConfig();

const app = express();
app.use(express.json());
app.use("/health", healthRouter);

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/stream" });

wss.on("connection", (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`Client connected: ${clientIp}`);

  const session = sessionManager.create({
    onPause: (audioChunk, sessionId) => {
     
      console.log(`${sessionId}] Audio ready — ${audioChunk.length} bytes`);

      ws.send(JSON.stringify({
        type: "processing",
        sessionId,
        message: "Processing your speech...",
      }));
    },
  });

  const { sessionId } = session;

  ws.send(JSON.stringify({
    type: "connected",
    sessionId,
    message: "NegotiaMind ready. Start speaking.",
  }));

  ws.on("message", (data, isBinary) => {
    if (!isBinary) {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "end") session.audioBuffer.forceFlush();
      } catch {
        console.warn(`[${sessionId}] Non-JSON text message`);
      }
      return;
    }

    // Binary = raw PCM chunk
    session.audioBuffer.push(data);
  });

  ws.on("close", () => {
    console.log(`Client disconnected: ${clientIp} [${sessionId}]`);
    session.audioBuffer.forceFlush();
    sessionManager.destroy(sessionId);
  });

  ws.on("error", (err) => {
    console.error(`WebSocket error [${sessionId}]:`, err.message);
  });
});

server.listen(config.port, () => {
  console.log(`NegotiaMind running on port ${config.port}`);
  console.log(`    HTTP → http://localhost:${config.port}/health`);
  console.log(`    WS   → ws://localhost:${config.port}/stream`);
});