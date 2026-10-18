const fs = require("fs");
const http = require("http");
const { once } = require("events");
const {
  startServerLifecycle,
} = require("../../lib/server/init/server-lifecycle");

describe("startServerLifecycle", () => {
  let inDocker;
  let server;
  let isOnboarded;
  let runOnboardedBootSequence;

  beforeEach(() => {
    inDocker = false;
    const existsSync = fs.existsSync;
    vi.spyOn(fs, "existsSync").mockImplementation((file) =>
      file === "/.dockerenv" ? inDocker : existsSync(file),
    );
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubEnv("ALPHACLAW_BIND_HOST", "");
    vi.stubEnv("ALPHACLAW_ROOT_DIR", "");
    server = { listen: vi.fn() };
    isOnboarded = vi.fn(() => true);
    runOnboardedBootSequence = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const start = (target = server, port = 3000) =>
    startServerLifecycle({
      server: target,
      PORT: port,
      isOnboarded,
      runOnboardedBootSequence,
    });

  it("binds bare metal to loopback, even with a /data root", () => {
    vi.stubEnv("ALPHACLAW_ROOT_DIR", "/data");
    start();
    expect(server.listen).toHaveBeenCalledWith(
      3000, "127.0.0.1", expect.any(Function),
    );
  });

  it("keeps Docker bridge deployments reachable", () => {
    inDocker = true;
    start();
    expect(server.listen).toHaveBeenCalledWith(
      3000, "0.0.0.0", expect.any(Function),
    );
  });

  it.each([false, true])("honors a trimmed host override (Docker=%s)", (docker) => {
    inDocker = docker;
    vi.stubEnv("ALPHACLAW_BIND_HOST", "  ::1  ");
    start();
    expect(server.listen).toHaveBeenCalledWith(
      3000, "::1", expect.any(Function),
    );
  });

  it.each([false, true])("ignores a blank override (Docker=%s)", (docker) => {
    inDocker = docker;
    vi.stubEnv("ALPHACLAW_BIND_HOST", " \t ");
    start();
    expect(server.listen).toHaveBeenCalledWith(
      3000, docker ? "0.0.0.0" : "127.0.0.1", expect.any(Function),
    );
  });

  it("reads the override at startup rather than module load", () => {
    vi.stubEnv("ALPHACLAW_BIND_HOST", "0.0.0.0");
    start();
    vi.stubEnv("ALPHACLAW_BIND_HOST", "127.0.0.1");
    start();
    expect(server.listen.mock.calls.map((call) => call[1])).toEqual([
      "0.0.0.0", "127.0.0.1",
    ]);
  });

  it("runs onboarded boot only after listening and logs the bound host", () => {
    start();
    expect(isOnboarded).not.toHaveBeenCalled();
    expect(runOnboardedBootSequence).not.toHaveBeenCalled();
    server.listen.mock.calls[0][2]();
    expect(runOnboardedBootSequence).toHaveBeenCalledOnce();
    expect(console.log).toHaveBeenCalledWith(
      "[alphaclaw] Express listening on 127.0.0.1:3000",
    );
  });

  it("still waits for onboarding on a fresh install", () => {
    isOnboarded.mockReturnValue(false);
    start();
    server.listen.mock.calls[0][2]();
    expect(runOnboardedBootSequence).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      "[alphaclaw] Awaiting onboarding via Setup UI",
    );
  });

  it.each([
    [false, "", "127.0.0.1"],
    [true, "", "0.0.0.0"],
    [false, "0.0.0.0", "0.0.0.0"],
    [true, "127.0.0.1", "127.0.0.1"],
  ])("opens a real HTTP socket (Docker=%s, override=%s)", async (docker, override, expected) => {
    inDocker = docker;
    vi.stubEnv("ALPHACLAW_BIND_HOST", override);
    const target = http.createServer((req, res) => res.end("ok"));
    try {
      const listening = once(target, "listening");
      start(target, 0);
      await listening;
      expect(target.address().address).toBe(expected);
      const response = await fetch(`http://127.0.0.1:${target.address().port}`);
      expect(await response.text()).toBe("ok");
    } finally {
      await new Promise((resolve, reject) => {
        target.close((error) => error ? reject(error) : resolve());
        target.closeAllConnections();
      });
    }
  });
});
