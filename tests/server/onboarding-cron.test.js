const path = require("path");
const { kRootDir } = require("../../lib/server/constants");
const {
  installHourlyGitSyncCron,
} = require("../../lib/server/onboarding/cron");
const {
  buildManagedCronContent,
  getSystemCronPaths,
  getSystemCronStatus,
  kDefaultSystemCronSchedule,
  kSystemCronPath,
  stopManagedScheduler,
} = require("../../lib/server/system-cron");
const {
  createCronMemoryFs,
  seedCronOpenclawDir,
} = require("./fixtures/cron-memory-fs");

const kRootDirLine = `ALPHACLAW_ROOT_DIR=${kRootDir}`;
const kHourlyGitSyncScript = "/tmp/openclaw/.alphaclaw/internal/hourly-git-sync.sh";
const kLinuxLogPath = "/var/log/openclaw-hourly-sync.log";
const kDarwinLogPath = "/tmp/openclaw/.alphaclaw/internal/hourly-git-sync.log";

const expectLinuxCronFile = (cronContent) => {
  expect(cronContent).toContain(kRootDirLine);
  expect(cronContent).toContain("SHELL=/bin/bash");
  expect(cronContent).toMatch(/^0 \* \* \* \* root bash /m);
  expect(cronContent.endsWith("\n")).toBe(true);
};

const expectManagedCronContent = (cronContent, { platform }) => {
  expect(cronContent).toContain(kRootDirLine);
  expect(cronContent).toContain("SHELL=/bin/bash");
  expect(cronContent.endsWith("\n")).toBe(true);
  if (platform === "linux") {
    expect(cronContent).toMatch(/^0 \* \* \* \* root bash /m);
    return;
  }
  expect(cronContent).toMatch(/^0 \* \* \* \* bash /m);
};

describe("server/onboarding/cron", () => {
  afterEach(() => {
    stopManagedScheduler();
  });

  describe("buildManagedCronContent", () => {
    it.each([
      ["linux", kLinuxLogPath],
      ["darwin", kDarwinLogPath],
    ])("%s embeds ALPHACLAW_ROOT_DIR in managed cron content", (platform, logPath) => {
      const content = buildManagedCronContent({
        schedule: kDefaultSystemCronSchedule,
        scriptPath: kHourlyGitSyncScript,
        logPath,
        platform,
      });
      expectManagedCronContent(content, { platform });
    });
  });

  describe("getSystemCronPaths", () => {
    it.each([
      ["linux", kSystemCronPath, "linux"],
      ["darwin", "managed scheduler", "darwin"],
    ])(
      "%s maps installPath to the platform cron backend",
      (platform, installPath, normalizedPlatform) => {
        const paths = getSystemCronPaths({
          openclawDir: "/tmp/openclaw-paths",
          platform,
        });
        expect(paths.platform).toBe(normalizedPlatform);
        expect(paths.installPath).toBe(installPath);
      },
    );
  });

  describe("installHourlyGitSyncCron", () => {
    describe("linux", () => {
      it("writes ALPHACLAW_ROOT_DIR into /etc/cron.d/openclaw-hourly-sync", async () => {
        const fs = createCronMemoryFs();
        const openclawDir = "/tmp/openclaw-onboard-linux";
        seedCronOpenclawDir(fs, openclawDir);

        const installed = await installHourlyGitSyncCron({
          fs,
          openclawDir,
          platform: "linux",
          execFileSyncImpl: vi.fn(() => ""),
        });

        expect(installed).toBe(true);
        expect(fs.files.has(kSystemCronPath)).toBe(true);
        expectLinuxCronFile(fs.files.get(kSystemCronPath));
        expect(
          getSystemCronStatus({ fs, openclawDir, platform: "linux" }),
        ).toEqual(
          expect.objectContaining({
            enabled: true,
            installed: true,
            platform: "linux",
            installMethod: "system_cron",
          }),
        );
      });
    });

    describe("darwin", () => {
      it("does not write /etc/cron.d and activates the managed scheduler", async () => {
        const fs = createCronMemoryFs();
        const openclawDir = "/tmp/openclaw-onboard-darwin";
        seedCronOpenclawDir(fs, openclawDir);

        const installed = await installHourlyGitSyncCron({
          fs,
          openclawDir,
          platform: "darwin",
          execFileSyncImpl: vi.fn(() => ""),
        });

        expect(installed).toBe(true);
        expect(fs.files.has(kSystemCronPath)).toBe(false);
        expect(
          getSystemCronStatus({ fs, openclawDir, platform: "darwin" }),
        ).toEqual(
          expect.objectContaining({
            enabled: true,
            installed: true,
            platform: "darwin",
            installMethod: "managed_scheduler",
          }),
        );
      });

      it("persists scheduler config JSON for managed cron reads", async () => {
        const fs = createCronMemoryFs();
        const openclawDir = "/tmp/openclaw-onboard-darwin-config";
        seedCronOpenclawDir(fs, openclawDir);
        const configPath = path.join(openclawDir, "cron", "system-sync.json");

        await installHourlyGitSyncCron({
          fs,
          openclawDir,
          platform: "darwin",
          execFileSyncImpl: vi.fn(() => ""),
        });

        expect(fs.files.has(configPath)).toBe(true);
        expect(JSON.parse(fs.files.get(configPath))).toEqual(
          expect.objectContaining({
            enabled: true,
            schedule: kDefaultSystemCronSchedule,
          }),
        );
      });

      it("uses managed cron content that carries ALPHACLAW_ROOT_DIR", () => {
        const { scriptPath, logPath } = getSystemCronPaths({
          openclawDir: "/tmp/openclaw-onboard-darwin-content",
          platform: "darwin",
        });
        const content = buildManagedCronContent({
          schedule: kDefaultSystemCronSchedule,
          scriptPath,
          logPath,
          platform: "darwin",
        });
        expectManagedCronContent(content, { platform: "darwin" });
        expect(content).toContain(scriptPath);
        expect(content).toContain(logPath);
      });
    });
  });
});
