const {
    BedrockRuntimeClient,
    InvokeModelCommand,
  } = require("@aws-sdk/client-bedrock-runtime");
  const { config } = require("../../config");
  
  const bedrockClient = new BedrockRuntimeClient({
    region: config.aws.region,
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    },
  });
  
  const SYSTEM_PROMPT = `You are NegotiaMind, an expert real-time negotiation assistant.
  
  Your job is to analyze what the user just said during a negotiation conversation and provide 3 concise, actionable suggestions for what they should say or do next.
  
  Rules:
  - Suggestions must be practical and specific to what was just said
  - Keep each suggestion under 2 sentences
  - Consider the full conversation history for context
  - Focus on: counter-offers, finding common ground, identifying leverage, de-escalation, or closing tactics
  - Return ONLY valid JSON — no extra text, no markdown
  
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
    console.log(`[${sessionId}] Sending to Bedrock Nova Pro...`);
  
    const messages = [
      ...conversationHistory,
      {
        role: "user",
        content: `The user just said: "${transcript}"\n\nProvide negotiation suggestions.`,
      },
    ];
  
    const requestBody = {
      messages,
      system: [{ text: SYSTEM_PROMPT }],
      inferenceConfig: {
        maxTokens: 1024,
        temperature: 0.7,
      },
    };
  
    const command = new InvokeModelCommand({
      modelId: config.bedrock.modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(requestBody),
    });
  
    const response = await bedrockClient.send(command);

    const rawBody = JSON.parse(Buffer.from(response.body).toString("utf-8"));
    const rawText = rawBody?.output?.message?.content?.[0]?.text || "";
  
    console.log(`[${sessionId}] Raw Bedrock response: ${rawText}`);

    let parsed;
    try {
      const clean = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch (err) {
      console.error(`[${sessionId}] Failed to parse Bedrock JSON:`, err.message);
      throw new Error("Invalid JSON response from Bedrock");
    }
  
    console.log(`[${sessionId}] Got ${parsed.suggestions?.length || 0} suggestions`);
    return parsed;
  }
  
  module.exports = { getNegotiationSuggestions };