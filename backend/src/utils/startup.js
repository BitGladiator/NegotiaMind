const redis = require("../services/redisService");

async function runStartupChecks() {
  console.log("Running startup checks...");
  try {
    await redis.connect();
    console.log("Redis — OK");
  } catch (err) {
    console.error("Redis unreachable:", err.message);
    process.exit(1);
  }

  console.log("All startup checks passed.");
}

module.exports = { runStartupChecks };