
const { createClient } = require("redis");
const { config } = require("../../config");

const redisClient = createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
});

redisClient.on("connect", () => console.log("Redis connected."));
redisClient.on("error", (err) => console.error("Redis error:", err.message));
redisClient.on("reconnecting", () => console.log("Redis reconnecting..."));

async function connect() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}


const sessionKey = (sessionId) => `negotiamind:session:${sessionId}`;


async function appendMessage(sessionId, role, content) {
  const key = sessionKey(sessionId);
  const message = JSON.stringify({ role, content });

  await redisClient.rPush(key, message);

 
  await redisClient.expire(key, config.redis.sessionTTL);

  console.log(`[${sessionId}] Appended ${role} message to Redis`);
}


async function getHistory(sessionId) {
  const key = sessionKey(sessionId);
  const raw = await redisClient.lRange(key, 0, -1);

  const history = raw.map((item) => JSON.parse(item));
  console.log(`[${sessionId}] Fetched ${history.length} messages from Redis`);
  return history;
}

async function clearHistory(sessionId) {
  const key = sessionKey(sessionId);
  await redisClient.del(key);
  console.log(`[${sessionId}] Cleared Redis history`);
}


async function getHistoryLength(sessionId) {
  const key = sessionKey(sessionId);
  return await redisClient.lLen(key);
}

module.exports = {
  connect,
  appendMessage,
  getHistory,
  clearHistory,
  getHistoryLength,
};