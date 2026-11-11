const path = require("path");

/**
 * In-memory fs double for system-cron / onboarding-cron tests.
 * Matches the contract used by lib/server/system-cron.js and onboarding/cron.js.
 */
const createCronMemoryFs = () => {
  const files = new Map();
  const dirs = new Set();

  const ensureParentDirs = (targetPath) => {
    let current = path.dirname(targetPath);
    while (current && !dirs.has(current)) {
      dirs.add(current);
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  };

  return {
    files,
    dirs,
    existsSync: vi.fn((targetPath) => files.has(targetPath) || dirs.has(targetPath)),
    mkdirSync: vi.fn((targetPath) => {
      dirs.add(targetPath);
      ensureParentDirs(targetPath);
    }),
    readFileSync: vi.fn((targetPath) => {
      if (targetPath.endsWith("hourly-git-sync.sh")) {
        return "echo sync";
      }
      if (files.has(targetPath)) {
        return files.get(targetPath);
      }
      throw Object.assign(new Error(`ENOENT: ${targetPath}`), { code: "ENOENT" });
    }),
    writeFileSync: vi.fn((targetPath, contents) => {
      ensureParentDirs(targetPath);
      files.set(targetPath, String(contents));
    }),
    rmSync: vi.fn((targetPath) => {
      files.delete(targetPath);
      dirs.delete(targetPath);
    }),
    readdirSync: vi.fn((targetPath) => {
      if (!dirs.has(targetPath)) return [];
      return [];
    }),
    statSync: vi.fn((targetPath) => {
      if (dirs.has(targetPath)) {
        return { isDirectory: () => true, isFile: () => false, mode: 0o755 };
      }
      if (files.has(targetPath)) {
        return { isDirectory: () => false, isFile: () => true, mode: 0o644 };
      }
      throw Object.assign(new Error(`ENOENT: ${targetPath}`), { code: "ENOENT" });
    }),
    copyFileSync: vi.fn((sourcePath, targetPath) => {
      ensureParentDirs(targetPath);
      files.set(targetPath, String(files.get(sourcePath) || ""));
    }),
  };
};

const seedCronOpenclawDir = (fs, openclawDir) => {
  fs.dirs.add(path.join(openclawDir, "cron"));
  fs.dirs.add(path.join(openclawDir, ".alphaclaw"));
  fs.files.set(path.join(openclawDir, "openclaw.json"), "{}");
};

module.exports = {
  createCronMemoryFs,
  seedCronOpenclawDir,
};
