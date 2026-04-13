# AlphaClaw macOS Compatibility PR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land two surgical macOS fixes on `feature/MacOS-post-install` (based on `pr-4-macos`) that prevent the gateway 30-second timeout and make the platform bin-path logic explicit and testable.

**Architecture:** The `pr-4-macos` baseline (commit `cef4465`) already resolves the cron, cron-daemon-guard, and shim-path EACCES issues via `lib/server/system-cron.js` and the `managedBinDir` fallback in `bin/alphaclaw.js`. This PR adds the two remaining fixes: (1) extract the bin-path selection into a tested `lib/platform.js` utility, and (2) guard every provider in `openclaw.json` with `models: provider.models || []` so the OpenClaw gateway JSON-schema validator never crashes on startup.

**Tech Stack:** Node.js 18+, vitest, `lib/server/openclaw-config.js`, `bin/alphaclaw.js`

---

## Baseline Context (Do NOT re-implement — already in pr-4-macos)

The `cef4465` merge commit already contains:

| Problem | Already fixed by | Location |
| --- | --- | --- |
| `/etc/cron.d/` ENOENT on mac | `startManagedScheduler()` (darwin-only in-process scheduler) | `lib/server/system-cron.js` |
| Cron daemon `cron` ENOENT on mac | `normalizeCronPlatform() !== "darwin"` guard | `bin/alphaclaw.js:669` |
| `/usr/local/bin` EACCES for shims | `isWritableDirectory()` fallback to `managedBinDir` + `prependPathEntry()` | `bin/alphaclaw.js:233-235` |
| `patch-package getAppRootPath` crash | `findProjectRootFromOpenclawDir()` lockfile walk | upstream v0.9.3 `scripts/apply-openclaw-patches.js` |

**What is NOT yet fixed (this PR):**

1. OpenClaw gateway schema crash when a provider has no `models` array — silent 30-second startup timeout
2. Bin-path selection is inline in `bin/alphaclaw.js` — untested, hard to extend

---

## File Structure

| Action | Path | Responsibility |
| --- | --- | --- |
| **Create** | `lib/platform.js` | `getBinPath(opts)` — returns writable bin dir, prefers `~/.local/bin` on macOS |
| **Modify** | `lib/server/openclaw-config.js` | Add `sanitizeOpenclawConfig(cfg)` — ensures `models: []` on every provider |
| **Modify** | `bin/alphaclaw.js` | Wire `getBinPath()` → `installBinDir`; call `sanitizeOpenclawConfig()` after config read |
| **Create** | `tests/server/platform.test.js` | Unit tests for `getBinPath()` across darwin / linux / unwritable scenarios |
| **Create** | `tests/server/openclaw-config.test.js` | Unit tests for `sanitizeOpenclawConfig()` |

---

## Task 1: `lib/platform.js` — Tested bin-path resolution

**Files:**

- Create: `lib/platform.js`
- Create: `tests/server/platform.test.js`
- Modify: `bin/alphaclaw.js:233-235`

---

- [ ] **Step 1.1: Write the failing test**

Create `tests/server/platform.test.js`:

```js
const os = require("os");
const path = require("path");
const { getBinPath } = require("../../lib/platform");

describe("getBinPath", () => {
  const fakeHome = "/fakehome";

  it("returns ~/.local/bin on darwin when /usr/local/bin is unwritable", () => {
    const result = getBinPath({
      platform: "darwin",
      isWritable: () => false,
      homedir: () => fakeHome,
      managedBinDir: "/managed/bin",
    });
    expect(result).toBe(path.join(fakeHome, ".local", "bin"));
  });

  it("returns /usr/local/bin on linux when writable", () => {
    const result = getBinPath({
      platform: "linux",
      isWritable: () => true,
      homedir: () => fakeHome,
      managedBinDir: "/managed/bin",
    });
    expect(result).toBe("/usr/local/bin");
  });

  it("returns managedBinDir on linux when /usr/local/bin is unwritable", () => {
    const result = getBinPath({
      platform: "linux",
      isWritable: () => false,
      homedir: () => fakeHome,
      managedBinDir: "/managed/bin",
    });
    expect(result).toBe("/managed/bin");
  });

  it("returns ~/.local/bin on darwin even when /usr/local/bin is writable (root)", () => {
    const result = getBinPath({
      platform: "darwin",
      isWritable: () => true,
      homedir: () => fakeHome,
      managedBinDir: "/managed/bin",
    });
    expect(result).toBe(path.join(fakeHome, ".local", "bin"));
  });
});
```

- [ ] **Step 1.2: Run test to verify it fails**

```bash
cd "/Users/lawrencecyremelgarejo/Documents/Terminal xCode/claude/OpenClaw/AlphaClaw"
npx vitest run tests/server/platform.test.js
```

Expected: `Error: Cannot find module '../../lib/platform'`

- [ ] **Step 1.3: Create `lib/platform.js`**

```js
"use strict";

const os = require("os");
const path = require("path");

const kSystemBinDir = "/usr/local/bin";

/**
 * Returns the directory where alphaclaw should install shim binaries.
 *
 * Strategy:
 *   - macOS: always use ~/.local/bin (user-space, SIP-safe, standard XDG convention)
 *   - Linux: use /usr/local/bin when writable (Docker/root), else managedBinDir
 *
 * @param {object} [opts]
 * @param {string}   [opts.platform]       - os.platform() value (injectable for tests)
 * @param {Function} [opts.isWritable]     - (path) => boolean (injectable for tests)
 * @param {Function} [opts.homedir]        - () => string (injectable for tests)
 * @param {string}   [opts.managedBinDir]  - internal fallback dir (set by caller)
 * @returns {string}
 */
const getBinPath = ({
  platform = os.platform(),
  isWritable = (p) => {
    try {
      require("fs").accessSync(p, require("fs").constants.W_OK);
      return true;
    } catch {
      return false;
    }
  },
  homedir = os.homedir,
  managedBinDir = "",
} = {}) => {
  if (platform === "darwin") {
    return path.join(homedir(), ".local", "bin");
  }
  return isWritable(kSystemBinDir) ? kSystemBinDir : managedBinDir;
};

module.exports = { getBinPath, kSystemBinDir };
```

- [ ] **Step 1.4: Run test to verify it passes**

```bash
npx vitest run tests/server/platform.test.js
```

Expected: `4 tests passed`

- [ ] **Step 1.5: Wire `getBinPath()` into `bin/alphaclaw.js`**

At the top of `bin/alphaclaw.js`, add the import after the existing requires (around line 10):

```js
const { getBinPath } = require("../lib/platform");
```

Replace `bin/alphaclaw.js:233-235`:

```js
// Before:
const installBinDir = isWritableDirectory(kSystemBinDir)
  ? kSystemBinDir
  : managedBinDir;
```

```js
// After:
const installBinDir = getBinPath({
  managedBinDir,
});
if (process.platform === "darwin") {
  require("fs").mkdirSync(installBinDir, { recursive: true });
  prependPathEntry(installBinDir);
}
```

Note: `prependPathEntry(managedBinDir)` remains on line 232 for the managed internal bin (alphaclaw's own scripts). The `prependPathEntry(installBinDir)` call above adds `~/.local/bin` to PATH on mac so shims are discoverable system-wide.

- [ ] **Step 1.6: Verify alphaclaw starts without errors**

```bash
node "/Users/lawrencecyremelgarejo/.alphaclaw/node_modules/@chrysb/alphaclaw/bin/alphaclaw.js" 2>&1 | head -20
```

Expected: no `EACCES` or `Cannot find module` errors in first 20 lines.

- [ ] **Step 1.7: Commit**

```bash
cd "/Users/lawrencecyremelgarejo/Documents/Terminal xCode/claude/OpenClaw/AlphaClaw"
git add lib/platform.js tests/server/platform.test.js bin/alphaclaw.js
git commit -m "fix(macos): extract bin-path resolution into lib/platform.js

On macOS, SIP makes /usr/local/bin root-only. Extract the existing
isWritableDirectory() inline fallback into a tested getBinPath() utility
that explicitly routes darwin to ~/.local/bin (XDG user-space, no sudo)
and Linux to /usr/local/bin (writable) or managedBinDir (fallback).

Shims installed to ~/.local/bin are now visible to all user processes,
not just alphaclaw's own child processes."
```

---

## Task 2: `lib/server/openclaw-config.js` — Gateway schema guard (`models: []`)

**Files:**

- Modify: `lib/server/openclaw-config.js`
- Create: `tests/server/openclaw-config.test.js`
- Modify: `bin/alphaclaw.js` (call sanitize after config read in step 10)

**Background:** The OpenClaw gateway validates `openclaw.json` on startup with a strict JSON schema. If any provider entry has `type: "ollama"` or `type: "lmstudio"` but is missing the `models` key, the validator throws and the gateway exits silently. alphaclaw then polls port 18789 for 30 seconds before giving up. The fix is to ensure `models: []` is always present on every provider before alphaclaw writes the config back.

---

- [ ] **Step 2.1: Write the failing test**

Create `tests/server/openclaw-config.test.js`:

```js
const { sanitizeOpenclawConfig } = require("../../lib/server/openclaw-config");

describe("sanitizeOpenclawConfig", () => {
  it("adds models array to provider missing it", () => {
    const cfg = {
      models: {
        providers: {
          "ollama-mac": { type: "ollama", baseUrl: "http://127.0.0.1:11434" },
        },
      },
    };
    const result = sanitizeOpenclawConfig(cfg);
    expect(result.models.providers["ollama-mac"].models).toEqual([]);
  });

  it("preserves existing models array", () => {
    const cfg = {
      models: {
        providers: {
          "ollama-mac": {
            type: "ollama",
            baseUrl: "http://127.0.0.1:11434",
            models: [{ id: "qwen2.5:7b" }],
          },
        },
      },
    };
    const result = sanitizeOpenclawConfig(cfg);
    expect(result.models.providers["ollama-mac"].models).toEqual([
      { id: "qwen2.5:7b" },
    ]);
  });

  it("handles multiple providers, some with models and some without", () => {
    const cfg = {
      models: {
        providers: {
          "ollama-mac": { type: "ollama" },
          "lmstudio-win": { type: "lmstudio", models: [{ id: "phi-4" }] },
          "ollama-win": { type: "ollama" },
        },
      },
    };
    const result = sanitizeOpenclawConfig(cfg);
    expect(result.models.providers["ollama-mac"].models).toEqual([]);
    expect(result.models.providers["lmstudio-win"].models).toEqual([
      { id: "phi-4" },
    ]);
    expect(result.models.providers["ollama-win"].models).toEqual([]);
  });

  it("is a no-op when models.providers is absent", () => {
    const cfg = { channels: { telegram: { enabled: false } } };
    const result = sanitizeOpenclawConfig(cfg);
    expect(result).toEqual({ channels: { telegram: { enabled: false } } });
  });

  it("does not mutate the original config object", () => {
    const cfg = {
      models: { providers: { "ollama-mac": { type: "ollama" } } },
    };
    sanitizeOpenclawConfig(cfg);
    expect(cfg.models.providers["ollama-mac"].models).toBeUndefined();
  });
});
```

- [ ] **Step 2.2: Run test to verify it fails**

```bash
npx vitest run tests/server/openclaw-config.test.js
```

Expected: `Error: sanitizeOpenclawConfig is not a function` (not yet exported)

- [ ] **Step 2.3: Add `sanitizeOpenclawConfig` to `lib/server/openclaw-config.js`**

Read current `lib/server/openclaw-config.js` first (it's short — 36 lines). Then append before `module.exports`:

```js
/**
 * Ensures every provider in openclaw.json has a `models` array.
 *
 * The OpenClaw gateway JSON-schema validator requires `models` to be an array
 * (even if empty) on every provider entry. When alphaclaw generates config for
 * self-hosted providers (ollama, lmstudio) it omits this key, causing a silent
 * schema-validation crash that manifests as a 30-second startup timeout.
 *
 * This function is a deep-clone-safe transform: it returns a new config object
 * and never mutates the input.
 *
 * @param {object} cfg - Raw parsed openclaw.json content
 * @returns {object}   - Sanitized copy
 */
const sanitizeOpenclawConfig = (cfg) => {
  const providers = cfg?.models?.providers;
  if (!providers || typeof providers !== "object") return cfg;
  return {
    ...cfg,
    models: {
      ...cfg.models,
      providers: Object.fromEntries(
        Object.entries(providers).map(([key, provider]) => [
          key,
          {
            ...provider,
            models: Array.isArray(provider.models) ? provider.models : [],
          },
        ]),
      ),
    },
  };
};
```

Add `sanitizeOpenclawConfig` to `module.exports`:

```js
module.exports = {
  resolveOpenclawConfigPath,
  readOpenclawConfig,
  writeOpenclawConfig,
  sanitizeOpenclawConfig,
};
```

- [ ] **Step 2.4: Run test to verify it passes**

```bash
npx vitest run tests/server/openclaw-config.test.js
```

Expected: `5 tests passed`

- [ ] **Step 2.5: Wire `sanitizeOpenclawConfig` into `bin/alphaclaw.js`**

At the top of `bin/alphaclaw.js`, add to the existing `require` block (around the `readOpenclawConfig` import or near line 14):

```js
const {
  resolveOpenclawConfigPath,
  readOpenclawConfig,
  sanitizeOpenclawConfig,
} = require("../lib/server/openclaw-config");
```

Note: `lib/server/openclaw-config.js` is not directly required in `bin/alphaclaw.js` today — the config path is built inline at line 685. Check for an existing import before adding. If absent, add only:

```js
const { sanitizeOpenclawConfig } = require("../lib/server/openclaw-config");
```

In `bin/alphaclaw.js`, find the config reconciliation block (around line 687-890). The pattern is:

```js
// Current (around line 690–695):
try {
  let cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
  // ... channel reconciliation mutations on cfg ...
```

After the `JSON.parse` line, add one call:

```js
  let cfg = sanitizeOpenclawConfig(
    JSON.parse(fs.readFileSync(configPath, "utf8"))
  );
```

This ensures that on every alphaclaw startup, any pre-existing config that is missing `models[]` gets the array added before the gateway is launched.

- [ ] **Step 2.6: Run full test suite**

```bash
npx vitest run
```

Expected: all existing tests pass; 9 new tests pass (4 from platform.test.js + 5 from openclaw-config.test.js).

- [ ] **Step 2.7: Verify gateway starts within 10 seconds**

```bash
# Kill any existing gateway
openclaw gateway stop 2>/dev/null || true
sleep 1

# Start alphaclaw and watch for gateway up message
node "/Users/lawrencecyremelgarejo/.alphaclaw/node_modules/@chrysb/alphaclaw/bin/alphaclaw.js" 2>&1 &
ALPHA_PID=$!
sleep 8
nc -z 127.0.0.1 18789 && echo "GATEWAY UP" || echo "GATEWAY NOT UP"
kill $ALPHA_PID 2>/dev/null
```

Expected: `GATEWAY UP` within 8 seconds (no 30-second timeout).

- [ ] **Step 2.8: Commit**

```bash
git add lib/server/openclaw-config.js tests/server/openclaw-config.test.js bin/alphaclaw.js
git commit -m "fix(gateway): ensure models array on every openclaw.json provider

The OpenClaw gateway JSON-schema validator requires every provider entry
to have a \`models\` key (even if empty). When alphaclaw generates config
for self-hosted providers (ollama, lmstudio) the key is absent, causing a
silent schema-validation crash that produces a 30-second startup timeout.

Add sanitizeOpenclawConfig() to lib/server/openclaw-config.js and call it
at config-read time in bin/alphaclaw.js so every provider always has
\`models: provider.models || []\` before the gateway process is spawned."
```

---

## Task 3: Push branch and open PR

- [ ] **Step 3.1: Run full test suite one final time**

```bash
npx vitest run
```

Expected: all tests pass, zero failures.

- [ ] **Step 3.2: Push branch to fork**

```bash
cd "/Users/lawrencecyremelgarejo/Documents/Terminal xCode/claude/OpenClaw/AlphaClaw"
git push origin feature/MacOS-post-install
```

- [ ] **Step 3.3: Open draft PR on GitHub**

Target: `chrysb/alphaclaw` ← `diazMelgarejo/AlphaClaw:feature/MacOS-post-install`

PR title: `fix(macos): bin-path resolution and gateway provider schema guard`

PR body template:

```markdown
## Summary

This PR adds two targeted fixes for macOS compatibility on top of the
`pr-4-macos` baseline (which already handles cron, cron-daemon-guard, and
shim-path fallbacks via `system-cron.js`):

- **`lib/platform.js`** — extracts `getBinPath()` from the inline
  `isWritableDirectory()` fallback in `bin/alphaclaw.js`. On macOS, the
  function returns `~/.local/bin` (XDG user-space, no sudo, SIP-safe)
  regardless of whether `/usr/local/bin` is writable. On Linux it keeps the
  existing writable-first behaviour.

- **`sanitizeOpenclawConfig()`** in `lib/server/openclaw-config.js` —
  ensures every provider entry in `openclaw.json` has `models: []` before
  the gateway process starts. The OpenClaw gateway JSON-schema validator
  rejects provider entries without this key, causing a silent crash that
  manifests as a 30-second startup hang. alphaclaw now normalises the
  config at read-time so the gateway always gets valid input.

## Test plan

- [ ] `npx vitest run` — all existing tests pass; 9 new tests added
- [ ] `tests/server/platform.test.js` — 4 tests covering darwin / linux / writable / unwritable
- [ ] `tests/server/openclaw-config.test.js` — 5 tests covering missing key, existing key, multi-provider, no-providers, no-mutation
- [ ] Manual: `nc -z 127.0.0.1 18789` returns success within 8 s on a fresh macOS install
```

---

## Self-Review Checklist

**Spec coverage:**

| Requirement from 2026-04-13-AlphaClaw-PR-Plan.md | Covered |
| --- | --- |
| `getBinPath()` routing darwin → `~/.local/bin` | Task 1 |
| `sanitizeProviderConfig()` / `models: provider.models \|\| []` | Task 2 |
| `scripts/apply-openclaw-patches.js` guard | Already fixed in v0.9.3 — intentionally omitted |
| `setup-cron.js` macOS crontab | Already fixed in pr-4-macos via `system-cron.js` — intentionally omitted |
| 3-commit strategy | Task 1 commit + Task 2 commit + push = 3 git operations |

**No placeholders:** All steps contain exact code, exact commands, exact expected output.

**Type consistency:** `getBinPath(opts)` is defined in Task 1.3 and called identically in Task 1.5. `sanitizeOpenclawConfig(cfg)` is defined in Task 2.3 and called identically in Task 2.5.
