const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const { config, validateConfig } = require("../config");
const healthRouter = require("./routes/health");
const sessionManager = require("./utils/sessionManager");
const { transcribeAudio } = require("./services/transcribeService");

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
    onPause: async (audioChunk, sessionId) => {
      try {
        // Notify frontend we are processing
        ws.send(JSON.stringify({
          type: "processing",
          sessionId,
          message: "Processing your speech...",
        }));

      
        const transcript = await transcribeAudio(audioChunk, sessionId);

        if (!transcript) {
          console.warn(`[${sessionId}] Empty transcript — skipping`);
          return;
        }

        // Send transcript back to frontend
        ws.send(JSON.stringify({
          type: "transcript",
          sessionId,
          text: transcript,
        }));

        // send transcript to Bedrock

      } catch (err) {
        console.error(`[${sessionId}] Pipeline error:`, err.message);
        ws.send(JSON.stringify({
          type: "error",
          sessionId,
          message: "Failed to process audio.",
        }));
      }
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