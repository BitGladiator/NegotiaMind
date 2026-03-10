const {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
} = require("@aws-sdk/client-transcribe-streaming");
const { config } = require("../../config");

const transcribeClient = new TranscribeStreamingClient({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

async function* bufferToStream(audioBuffer) {
  const CHUNK_SIZE = 8192;
  let offset = 0;

  while (offset < audioBuffer.length) {
    const end = Math.min(offset + CHUNK_SIZE, audioBuffer.length);
    const slice = audioBuffer.slice(offset, end);
    yield { AudioEvent: { AudioChunk: slice } };
    offset = end;
  }
}

async function transcribeAudio(audioBuffer, sessionId) {
  console.log(
    `[${sessionId}] Sending to Transcribe — ${(
      audioBuffer.length / 1024
    ).toFixed(1)} KB`
  );

  const command = new StartStreamTranscriptionCommand({
    LanguageCode: config.transcribe.languageCode,
    MediaSampleRateHertz: config.transcribe.sampleRate,
    MediaEncoding: "pcm",
    AudioStream: bufferToStream(audioBuffer),
  });

  const response = await transcribeClient.send(command);

  let finalTranscript = "";

  for await (const event of response.TranscriptResultStream) {
    if (!event.TranscriptEvent) continue;

    const results = event.TranscriptEvent.Transcript?.Results || [];

    for (const result of results) {
      if (result.IsPartial) continue;

      const text = result.Alternatives?.[0]?.Transcript || "";
      if (text) {
        finalTranscript += (finalTranscript ? " " : "") + text;
        console.log(`[${sessionId}] Transcript chunk: "${text}"`);
      }
    }
  }

  const trimmed = finalTranscript.trim();
  console.log(`[${sessionId}] Final transcript: "${trimmed}"`);
  return trimmed;
}

module.exports = { transcribeAudio };
