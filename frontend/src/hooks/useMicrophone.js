import { useRef, useCallback } from "react";

const SAMPLE_RATE = 16000;

// Inline AudioWorklet processor as a blob URL
const WORKLET_CODE = `
class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      // Convert Float32 → Int16 PCM
      const float32 = input[0];
      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        const clamped = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = clamped < 0 ? clamped * 32768 : clamped * 32767;
      }
      this.port.postMessage(int16.buffer, [int16.buffer]);
    }
    return true;
  }
}
registerProcessor("pcm-processor", PCMProcessor);
`;

export function useMicrophone({ onChunk, onError }) {
  const streamRef   = useRef(null);
  const contextRef  = useRef(null);
  const workletRef  = useRef(null);
  const blobUrlRef  = useRef(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const context = new AudioContext({ sampleRate: SAMPLE_RATE });
      contextRef.current = context;

      // Create blob URL for worklet
      const blob = new Blob([WORKLET_CODE], { type: "application/javascript" });
      const blobUrl = URL.createObjectURL(blob);
      blobUrlRef.current = blobUrl;

      // Load the worklet
      await context.audioWorklet.addModule(blobUrl);

      const source = context.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(context, "pcm-processor");
      workletRef.current = workletNode;

      // Receive PCM chunks from the worklet
      workletNode.port.onmessage = (event) => {
        onChunk(event.data); // ArrayBuffer of Int16 PCM
      };

      source.connect(workletNode);
      workletNode.connect(context.destination);

    } catch (err) {
      console.error("Mic error:", err);
      onError(err.message || "Microphone access denied");
    }
  }, [onChunk, onError]);

  const stop = useCallback(() => {
    workletRef.current?.disconnect();
    contextRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());

    // Revoke blob URL
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    streamRef.current  = null;
    contextRef.current = null;
    workletRef.current = null;
  }, []);

  return { start, stop };
}