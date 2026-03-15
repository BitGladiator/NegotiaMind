const { createClient } = require("@deepgram/sdk");
const { config } = require("../../config");

const deepgram = createClient(config.deepgram.apiKey);

async function transcribeAudio(audioBuffer, sessionId) {
  console.log(`[${sessionId}] Sending to Deepgram — ${(audioBuffer.length / 1024).toFixed(1)} KB`);

  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    audioBuffer,
    {
      model: "nova-2",          
      language: "en-US",
      smart_format: true,       
      punctuate: true,
      encoding: "linear16",     
      sample_rate: 16000,
    }
  );

  if (error) {
    console.error(`[${sessionId}] Deepgram error:`, error);
    throw new Error("Deepgram transcription failed");
  }

  const transcript =
    result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

  const trimmed = transcript.trim();
  console.log(`[${sessionId}] Transcript: "${trimmed}"`);
  return trimmed;
}

module.exports = { transcribeAudio };