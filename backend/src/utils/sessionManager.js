const { v4: uuidv4 } = require("uuid");
const AudioBuffer = require("../utils/audioBuffer");

class SessionManager {
  constructor() {
    this.sessions = new Map();
  }

  create({ onPause, overrideSessionId = null }) {
    const sessionId = overrideSessionId || uuidv4();

    const audioBuffer = new AudioBuffer({ sessionId, onPause });

    const session = {
      sessionId,
      audioBuffer,
      connectedAt: new Date().toISOString(),
    };

    this.sessions.set(sessionId, session);
    console.log(`Session ${overrideSessionId ? "resumed" : "created"}: ${sessionId}`);
    return session;
  }

  get(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  destroy(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.audioBuffer.destroy();
      this.sessions.delete(sessionId);
      console.log(`Session destroyed: ${sessionId}`);
    }
  }

  get count() {
    return this.sessions.size;
  }
}

module.exports = new SessionManager();