const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const { config, validateConfig } = require("../config");
const healthRouter = require("./routes/health");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const requestLogger = require("./middleware/requestLogger");
const sessionManager = require("./utils/sessionManager");
const { runStartupChecks } = require("./utils/startup");
const { startSessionCleaner } = require("./utils/sessionCleaner");
const { transcribeAudio } = require("./services/transcribeService");
const { getNegotiationSuggestions } = require("./services/bedrockService");
const redis = require("./services/redisService");

validateConfig();

const app = express();
app.use(express.json());
app.use(requestLogger);
app.use("/health", healthRouter);
app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/stream" });


function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully...`);
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));


(async () => {
  await runStartupChecks();
  startSessionCleaner();

  wss.on("connection", (ws, req) => {
    const clientIp = req.socket.remoteAddress;

    
    const urlParams = new URL(req.url, `http://localhost`).searchParams;
    const existingSessionId = urlParams.get("sessionId");

    console.log(`Client connected: ${clientIp}${existingSessionId ? ` (resuming ${existingSessionId})` : ""}`);

    const session = sessionManager.create({
     
      overrideSessionId: existingSessionId || null,

      onPause: async (audioChunk, sessionId) => {
        try {
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

          ws.send(JSON.stringify({ type: "transcript", sessionId, text: transcript }));

          const conversationHistory = await redis.getHistory(sessionId);

          const result = await getNegotiationSuggestions(
            transcript,
            conversationHistory,
            sessionId
          );

          await redis.appendMessage(sessionId, "user", transcript);
          await redis.appendMessage(sessionId, "assistant", JSON.stringify(result));

          ws.send(JSON.stringify({
            type: "suggestion",
            sessionId,
            transcript,
            suggestions: result.suggestions,
            sentiment:   result.sentiment,
            summary:     result.summary,
          }));

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
      resumed: !!existingSessionId,
      message: existingSessionId
        ? "Session resumed. Context restored."
        : "NegotiaMind ready. Start speaking.",
    }));

    ws.on("message", (data, isBinary) => {
      if (!isBinary) {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === "end")   session.audioBuffer.forceFlush();
          if (msg.type === "reset") redis.clearHistory(sessionId);
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
    console.log(`HTTP → http://localhost:${config.port}/health`);
    console.log(`WS   → ws://localhost:${config.port}/stream`);
  });
})();