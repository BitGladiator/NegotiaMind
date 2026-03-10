const sessionManager = require("./sessionManager");

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;  
const SESSION_MAX_AGE_MS  = 30 * 60 * 1000; 

function startSessionCleaner() {
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of sessionManager.sessions) {
      const age = now - new Date(session.connectedAt).getTime();
      if (age > SESSION_MAX_AGE_MS) {
        session.audioBuffer.destroy();
        sessionManager.sessions.delete(sessionId);
        cleaned++;
        console.log(`Cleaned stale session: ${sessionId}`);
      }
    }

    if (cleaned > 0) {
      console.log(`Session cleanup — removed ${cleaned} stale session(s). Active: ${sessionManager.count}`);
    }
  }, CLEANUP_INTERVAL_MS);

  console.log("Session cleaner started.");
}

module.exports = { startSessionCleaner };