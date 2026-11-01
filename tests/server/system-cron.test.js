const path = require("path");
const { kRootDir } = require("../../lib/server/constants");
const {
  installHourlyGitSyncCron,
} = require("../../lib/server/onboarding/cron");
const {
  getSystemCronStatus,
  isValidCronSchedule,
  kSystemCronPath,
  stopManagedScheduler,
} = require("../../lib/server/system-cron");
const {
  createCronMemoryFs,
  seedCronOpenclawDir,
} = require("./fixtures/cron-memory-fs");

const kRootDirLine = `ALPHACLAW_ROOT_DIR=${kRootDir}`;

describe("server/system-cron", () => {
  afterEach(() => {
    stopManagedScheduler();
  });

  it("rejects named cron tokens", () => {
    expect(isValidCronSchedule("0 * * * MON")).toBe(false);
    expect(isValidCronSchedule("0 * * * *")).toBe(true);
  });

  it("writes /etc/cron.d/openclaw-hourly-sync on linux install", async () => {
    const fs = createCronMemoryFs();
    const openclawDir = "/tmp/openclaw-linux";
    seedCronOpenclawDir(fs, openclawDir);

    const result = await installHourlyGitSyncCron({
      fs,
      openclawDir,
      platform: "linux",
      execFileSyncImpl: vi.fn(() => ""),
    });

    expect(result).toBe(true);
    expect(fs.files.has(kSystemCronPath)).toBe(true);
    const cronContent = fs.files.get(kSystemCronPath);
    expect(cronContent).toContain("0 * * * *");
    expect(cronContent).toContain(kRootDirLine);
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

  it("darwin: disable stops scheduler; re-enable restarts it", async () => {
    const fs = createCronMemoryFs();
    const openclawDir = "/tmp/openclaw-roundtrip";
    seedCronOpenclawDir(fs, openclawDir);
    const cronStatus = (installed) =>
      getSystemCronStatus({ fs, openclawDir, platform: "darwin" }).installed === installed;

    // Initial install — scheduler must be active.
    await installHourlyGitSyncCron({
      fs,
      openclawDir,
      platform: "darwin",
      execFileSyncImpl: vi.fn(() => ""),
    });
    expect(cronStatus(true)).toBe(true);

    // Simulate a disable (e.g. user toggles sync off).
    stopManagedScheduler();
    expect(cronStatus(false)).toBe(true);

    // Re-enable — installHourlyGitSyncCron called again (same code path as
    // onboarding, which is the only writer of this state today).
    const reEnableResult = await installHourlyGitSyncCron({
      fs,
      openclawDir,
      platform: "darwin",
      execFileSyncImpl: vi.fn(() => ""),
    });
    expect(reEnableResult).toBe(true);
    expect(cronStatus(true)).toBe(true);
  });

  it("return value equals getSystemCronStatus().installed on darwin", async () => {
    const fs = createCronMemoryFs();
    const openclawDir = "/tmp/openclaw-retval-darwin";
    seedCronOpenclawDir(fs, openclawDir);

    const result = await installHourlyGitSyncCron({
      fs,
      openclawDir,
      platform: "darwin",
      execFileSyncImpl: vi.fn(() => ""),
    });

    const liveStatus = getSystemCronStatus({ fs, openclawDir, platform: "darwin" });
    // Return value must be the precise runtime postcondition, not a
    // broadened expression like (installed || (darwin && enabled)).
    expect(result).toBe(liveStatus.installed);
    expect(result).toBe(true);
  });

  it("return value equals getSystemCronStatus().installed on linux", async () => {
    const fs = createCronMemoryFs();
    const openclawDir = "/tmp/openclaw-retval-linux";
    seedCronOpenclawDir(fs, openclawDir);

    const result = await installHourlyGitSyncCron({
      fs,
      openclawDir,
      platform: "linux",
      execFileSyncImpl: vi.fn(() => ""),
    });

    const liveStatus = getSystemCronStatus({ fs, openclawDir, platform: "linux" });
    expect(result).toBe(liveStatus.installed);
    expect(result).toBe(true);
  });

  it("activates the managed scheduler after macOS install", async () => {
    const fs = createCronMemoryFs();
    const openclawDir = "/tmp/openclaw";
    seedCronOpenclawDir(fs, openclawDir);

    const result = await installHourlyGitSyncCron({
      fs,
      openclawDir,
      platform: "darwin",
      execFileSyncImpl: vi.fn(() => ""),
    });

    expect(result).toBe(true);
    expect(
      getSystemCronStatus({
        fs,
        openclawDir,
        platform: "darwin",
      }),
    ).toEqual(
      expect.objectContaining({
        enabled: true,
        schedule: "0 * * * *",
        installed: true,
        platform: "darwin",
        installMethod: "managed_scheduler",
      }),
    );
  });
});
