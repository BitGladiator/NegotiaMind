require("dotenv").config();

const REQUIRED_VARS = [
  // "AWS_REGION",
  // "AWS_ACCESS_KEY_ID",
  // "AWS_SECRET_ACCESS_KEY",
  // "BEDROCK_MODEL_ID",
];

function validateConfig() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing: ${missing.join(", ")}`);
    process.exit(1);
  }
  console.log("Config validated.");
}

const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  transcribe: {
    languageCode: process.env.TRANSCRIBE_LANGUAGE_CODE || "en-US",
    sampleRate: parseInt(process.env.TRANSCRIBE_SAMPLE_RATE || "16000", 10),
  },
  bedrock: {
    modelId: process.env.BEDROCK_MODEL_ID,
  },
};

module.exports = { config, validateConfig };
