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

```
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
- [macOS post-install lessons](../macos-post-install-lessons.md) § Bug Archaeology
