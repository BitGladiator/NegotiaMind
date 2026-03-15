require("dotenv").config();

const REQUIRED_VARS = [
  "AWS_REGION",
  "BEDROCK_API_KEY",
  "BEDROCK_MODEL_ID",
  "DEEPGRAM_API_KEY",
];

function validateConfig() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing required env vars: ${missing.join(", ")}`);
    process.exit(1);
  }
  console.log("Config validated.");
}

const config = {
  port: parseInt(process.env.PORT || "3000", 10),

  aws: {
    region: process.env.AWS_REGION,
  },

  bedrock: {
    apiKey: process.env.BEDROCK_API_KEY,
    modelId: process.env.BEDROCK_MODEL_ID,
    baseUrl: process.env.BEDROCK_BASE_URL,
  },

  deepgram: {
    apiKey: process.env.DEEPGRAM_API_KEY,
  },

  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    sessionTTL: parseInt(process.env.REDIS_SESSION_TTL || "86400", 10),
  },
};

module.exports = { config, validateConfig };