# 04. macOS Cron / LaunchAgent

**TL;DR:** `/etc/cron.d` is root-only on macOS — writing there silently fails with EACCES. Use the in-process managed scheduler on darwin. Named cron tokens (`MON`, `SUN`) crash the parser — numeric-only fields only.

---

## The Two Bugs Fixed

### Bug 1: macOS Activation Loop (`7cfa041`)

#### Root Cause

```js
// BEFORE — classic chicken-and-egg bug
if (status.installed) {           // ← always false on first darwin run
  startManagedScheduler(…);
}
return status.installed;          // ← returns false; onboarding silently "succeeds"
```

`getSystemCronStatus().installed` on darwin reads `kSchedulerState.active`. `kSchedulerState.active` starts `false`. `startManagedScheduler()` is the only call that sets it `true`. The guard checked the postcondition before performing the action.

#### Fix

```js
// AFTER — check the right condition
if (status.platform === "darwin" && status.enabled) {
  startManagedScheduler({ fs, openclawDir, platform });
}
```

`status.enabled` reflects the just-written config snapshot (`cron/system-sync.json`). It is `true` immediately after `applySystemCronConfig()` succeeds — no circular dependency.

### Bug 2: Return Contract (`a05cbe9`)

The broadened return `status.installed || (platform === "darwin" && status.enabled)` was imprecise. Fixed:

```js
const finalStatus = getSystemCronStatus({ fs, openclawDir, platform });
return finalStatus.installed;
```

`startManagedScheduler()` sets `kSchedulerState.active` synchronously, so the re-read is always accurate.

---

### Bug 3: Named Cron Tokens (`2d3cd2c`)

#### Root Cause

The managed scheduler parser calls `Number.parseInt(token)` per cron field. Named tokens (`MON`, `SUN`, `JAN`) parse to `NaN`. `NaN` never matches any numeric range → `cronMatchesDate()` always `false` → sync silently never runs.

#### Fix

```js
// isValidCronSchedule() — reject non-numeric tokens at save time
return parts.every((part) => /^[\d,*/\-]+$/.test(part));
```

Named tokens now return HTTP 400 from `PUT /api/sync-cron`:
```json
{ "ok": false, "error": "schedule must be a 5-field cron string" }
```

---

## Platform Branching

| Action | macOS | Linux |
|--------|-------|-------|
| Install hourly sync | in-process `startManagedScheduler()` | write `/etc/cron.d/openclaw-hourly-sync` |
| Config location | `<openclawDir>/cron/system-sync.json` | `/etc/cron.d/openclaw-hourly-sync` |
| `getSystemCronStatus().installed` reads | `kSchedulerState.active` | `fs.existsSync(kSystemCronPath)` |

---

## Rule

**Never write to `/etc/cron.d` on darwin.** The `normalizeCronPlatform() !== "darwin"` guard in `lib/server/system-cron.js` enforces this — do not remove it.

**Always validate cron schedules with `isValidCronSchedule()` before saving.** Reject named tokens at the API boundary, not at parse time.

---

## Tests

### Test layout (platform-aware)

Cron install behavior is **platform-dependent**. Tests must mirror production branching — never assume `os.platform()` is linux when asserting `/etc/cron.d/` writes.

| Layer | File | What it proves |
|-------|------|----------------|
| Contract | `onboarding-cron.test.js` → `buildManagedCronContent` | `ALPHACLAW_ROOT_DIR` present on **both** linux and darwin |
| Paths | `onboarding-cron.test.js` → `getSystemCronPaths` | linux → `/etc/cron.d/openclaw-hourly-sync`; darwin → managed scheduler + `cron/system-sync.json` |
| Integration | `onboarding-cron.test.js` → `installHourlyGitSyncCron` | linux writes `/etc/cron.d/`; darwin starts managed scheduler (no `/etc/cron.d/` write) |
| System cron | `system-cron.test.js` | Named-token rejection, install/disable/re-enable, return contract |

Shared fixture: `tests/server/fixtures/cron-memory-fs.js` (`createCronMemoryFs`, `seedCronOpenclawDir`) — use this instead of duplicating in-memory `fs` doubles.

### CI failure: macOS-only onboarding cron test (2026-07-31)

**Symptom:** GitHub Actions `onboarding-cron.test.js` → `writes ALPHACLAW_ROOT_DIR into the generated system cron file` failed on **macos-latest** only (778/779 pass). Linux passed.

**Root cause:** Upstream merge (wright-io PR #107 / `cac34c9`) added `onboarding-cron.test.js` that called `installHourlyGitSyncCron()` **without** `platform: "linux"`. On darwin, `applySystemCronConfig()` correctly skips `/etc/cron.d/` (root-only, EACCES) and uses the in-process managed scheduler instead. The test expected a write to `/etc/cron.d/openclaw-hourly-sync` that **never happens on macOS by design**.

**Why `system-cron.test.js` was fine:** It already passed explicit `platform: "linux"` / `"darwin"` to install helpers. The new onboarding test did not.

**Fix (PR after #22 merge):** Replace linux-only assertions with layered platform-aware coverage aligned to `system-cron.test.js`:

1. `buildManagedCronContent` contract — both platforms, `ALPHACLAW_ROOT_DIR` line
2. `getSystemCronPaths` — install backend mapping per platform
3. `installHourlyGitSyncCron` — linux writes `/etc/cron.d/`; darwin uses managed scheduler + JSON config

**Rule for agents:** When porting or writing cron tests, **always** pass explicit `platform` to install helpers, or split linux/darwin cases with `it.each`. Never assert `/etc/cron.d/` file existence without `platform: "linux"`.

### Current test inventory

```
tests/server/fixtures/cron-memory-fs.js
  shared in-memory fs + openclaw dir seeding

tests/server/onboarding-cron.test.js
  ✓ buildManagedCronContent includes ALPHACLAW_ROOT_DIR (linux + darwin)
  ✓ getSystemCronPaths maps install backend per platform
  ✓ installHourlyGitSyncCron: linux writes /etc/cron.d; darwin uses managed scheduler

tests/server/system-cron.test.js
  ✓ rejects named cron tokens
  ✓ writes /etc/cron.d/openclaw-hourly-sync on linux install
  ✓ darwin: disable stops scheduler; re-enable restarts it
  ✓ return value equals getSystemCronStatus().installed on darwin
  ✓ return value equals getSystemCronStatus().installed on linux
  ✓ activates the managed scheduler after macOS install
```

---

## Related

- [02 — macOS Bin-Path & SIP](02-macos-bin-path.md) — same root-path ownership pattern
- PR commits: `2d3cd2c`, `7cfa041`, `a05cbe9`–`4cba0d8`
- CI fix: platform-aware `onboarding-cron.test.js` (post–PR #22, branch `cursor/cron-platform-tests-f559`)
- [macOS post-install lessons](../macos-post-install-lessons.md) § Bug Archaeology
