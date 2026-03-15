const https = require("https");
const { config } = require("../../config");

const SYSTEM_PROMPT = `You are NegotiaMind, an expert real-time negotiation assistant.

Your job is to analyze what the user just said during a negotiation conversation and provide 3 concise, actionable suggestions for what they should say or do next.

Rules:
- Suggestions must be practical and specific to what was just said
- Keep each suggestion under 2 sentences
- Consider the full conversation history for context
- Focus on: counter-offers, finding common ground, identifying leverage, de-escalation, or closing tactics
- Return ONLY valid JSON — no extra text, no markdown fences

Response format:
{
  "suggestions": [
    { "id": 1, "tactic": "tactic name", "text": "suggested response or action" },
    { "id": 2, "tactic": "tactic name", "text": "suggested response or action" },
    { "id": 3, "tactic": "tactic name", "text": "suggested response or action" }
  ],
  "sentiment": "positive" | "neutral" | "tense",
  "summary": "one sentence summary of the current negotiation state"
}`;

async function getNegotiationSuggestions(transcript, conversationHistory, sessionId) {
  console.log(`[${sessionId}] Sending to Bedrock Nova Pro via API key...`);

  const messages = [
    ...conversationHistory.map((msg) => ({
      role: msg.role,
      content: [{ text: msg.content }],       
    })),
    {
      role: "user",
      content: [{ text: `The user just said: "${transcript}"\n\nProvide negotiation suggestions.` }],  // ← wrap in array
    },
  ];

  const requestBody = JSON.stringify({
    messages,
    system: [{ text: SYSTEM_PROMPT }],
    inferenceConfig: {
      maxTokens: 1024,
      temperature: 0.7,
    },
  });

  const baseUrl = config.bedrock.baseUrl;
  const modelId = config.bedrock.modelId;
  const apiKey  = config.bedrock.apiKey;

  const url = new URL(`/model/${encodeURIComponent(modelId)}/invoke`, baseUrl);

  const rawBody = await new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      path:     url.pathname,
      method:   "POST",
      headers: {
        "Content-Type":   "application/json",
        "Authorization":  `Bearer ${apiKey}`,
        "Content-Length": Buffer.byteLength(requestBody),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        console.log(`[${sessionId}] Bedrock status: ${res.statusCode}`);
        if (res.statusCode !== 200) {
          reject(new Error(`Bedrock HTTP ${res.statusCode}: ${data}`));
        } else {
          resolve(data);
        }
      });
    });

    req.on("error", reject);
    req.write(requestBody);
    req.end();
  });

  const parsed  = JSON.parse(rawBody);
  const rawText = parsed?.output?.message?.content?.[0]?.text || "";

  console.log(`[${sessionId}] Raw Bedrock text: ${rawText}`);

  let result;
  try {
    const clean = rawText.replace(/```json|```/g, "").trim();
    result = JSON.parse(clean);
  } catch (err) {
    console.error(`[${sessionId}] Failed to parse Bedrock JSON:`, err.message);
    throw new Error("Invalid JSON response from Bedrock");
  }

  console.log(`[${sessionId}] Got ${result.suggestions?.length || 0} suggestions`);
  return result;
}

module.exports = { getNegotiationSuggestions };