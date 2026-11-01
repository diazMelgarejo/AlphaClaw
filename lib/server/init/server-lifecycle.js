const fs = require("fs");

const startServerLifecycle = ({
  server,
  PORT,
  isOnboarded,
  runOnboardedBootSequence,
}) => {
  // A data-directory choice is not evidence of container isolation.
  const listenHost =
    (process.env.ALPHACLAW_BIND_HOST || "").trim() ||
    (fs.existsSync("/.dockerenv") ? "0.0.0.0" : "127.0.0.1");
  server.listen(PORT, listenHost, () => {
    console.log(`[alphaclaw] Express listening on ${listenHost}:${PORT}`);
    if (isOnboarded()) {
      runOnboardedBootSequence();
    } else {
      console.log("[alphaclaw] Awaiting onboarding via Setup UI");
    }
  });
};

const registerServerShutdown = ({ gmailWatchService, watchdogTerminal }) => {
  const shutdownGmailWatchService = async () => {
    try {
      await gmailWatchService.stop();
    } catch {}
    watchdogTerminal.disposeSession();
  };

  process.on("SIGTERM", () => {
    shutdownGmailWatchService();
  });
  process.on("SIGINT", () => {
    shutdownGmailWatchService();
  });
};

module.exports = {
  startServerLifecycle,
  registerServerShutdown,
};
