const express = require("express");
const router = express.Router();
const { config } = require("../../config");

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "NegotiaMind",
    uptime: `${Math.floor(process.uptime())}s`,
    aws: { region: config.aws.region, bedrockModel: config.bedrock.modelId },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;