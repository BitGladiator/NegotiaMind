const SILENCE_THRESHOLD = 500;   // RMS energy below this = silence
const PAUSE_DURATION_MS = 1500;  // ms of silence before we trigger

class AudioBuffer {
  constructor({ onPause, sessionId }) {
    this.sessionId = sessionId;
    this.onPause = onPause;
    this.chunks = [];
    this.silenceTimer = null;
    this.totalBytes = 0;
  }

  push(chunk) {
    this.chunks.push(chunk);
    this.totalBytes += chunk.length;

    const energy = this._rms(chunk);

    if (energy < SILENCE_THRESHOLD) {
      if (!this.silenceTimer) {
        this.silenceTimer = setTimeout(() => {
          this._flush();
        }, PAUSE_DURATION_MS);
      }
    } else {
      this._clearTimer();
    }
  }

  _flush() {
    if (this.chunks.length === 0) return;

    const collected = Buffer.concat(this.chunks);
    console.log(`[${this.sessionId}] Pause detected — flushing ${(collected.length / 1024).toFixed(1)} KB`);

    this.chunks = [];
    this.totalBytes = 0;
    this._clearTimer();

    this.onPause(collected, this.sessionId);
  }

  _rms(buffer) {
    let sum = 0;
    for (let i = 0; i + 1 < buffer.length; i += 2) {
      const sample = buffer.readInt16LE(i);
      sum += sample * sample;
    }
    return Math.sqrt(sum / (buffer.length / 2));
  }

  _clearTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  forceFlush() {
    this._clearTimer();
    this._flush();
  }

  destroy() {
    this._clearTimer();
    this.chunks = [];
  }
}

module.exports = AudioBuffer;