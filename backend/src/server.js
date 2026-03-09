const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const { config, validateConfig } = require("../config");
const healthRouter = require("./routes/health");

validateConfig();

const app = express();
app.use(express.json());
app.use("/health", healthRouter);

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/stream" });

wss.on("connection", (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`Client connected: ${clientIp}`);
  ws.send(JSON.stringify({ type: "connected", message: "NegotiaMind ready." }));

  ws.on("message", (data) => {
    console.log(`Received chunk — ${data.length} bytes`);
  });

  ws.on("close", () => console.log(`Client disconnected: ${clientIp}`));
  ws.on("error", (err) => console.error(`WS error:`, err.message));
});

server.listen(config.port, () => {
  console.log(`NegotiaMind running on port ${config.port}`);
  console.log(`   HTTP → http://localhost:${config.port}/health`);
  console.log(`   WS   → ws://localhost:${config.port}/stream`);
});