# macOS Post-Install Lessons Learned
> Branch: `feature/MacOS-post-install` — Context for PR #63 (chrysb/alphaclaw)
> Last updated: 2026-04-16
> Status: **ALL CONCERNS RESOLVED**
> Test run (final): `tests/server/system-cron.test.js` (6/6 ✓), `tests/server/routes-system.test.js` (24/24 ✓) — 28 total

---

## Executive Summary

PR #63 introduced two bug fixes (macOS activation loop, silent named-token cron failure)
and the follow-up surgical pass (`a05cbe9`–`4cba0d8`) closed all remaining concerns:
tightened the return contract on `installHourlyGitSyncCron()` and filled every test gap.
The branch is merge-ready.

---

## Full Commit Chain (oldest → newest)

| SHA      | Title                                                             | Status   |
|----------|-------------------------------------------------------------------|----------|
| `3bbf43d` | fix(macos): extract bin-path resolution into lib/platform.js    | ✓ merged |
| `3d99697` | fix(platform): address code review issues                        | ✓ merged |
| `4d04616` | fix(gateway): ensure models array on every openclaw.json provider | ✓ merged |
| `61c8284` | fix(gateway): harden sanitizeOpenclawConfig against edge cases   | ✓ merged |
| `99de3c0` | fix: resolve 3 test failures from merge conflict residue         | ✓ merged |
| `2d3cd2c` | fix(macos): address review feedback — scheduler activation + cron validation | ✓ merged |
| `7cfa041` | fix(macos): start managed scheduler and tighten cron validation  | ✓ PR #63 head |
| `a05cbe9` | fix(macos): tighten installHourlyGitSyncCron return contract     | ✓ follow-up |
| `7641a7f` | test(system-cron): assert /etc/cron.d write on linux install     | ✓ follow-up |
| `a7bd4b2` | test(system-cron): darwin disable -> re-enable round-trip        | ✓ follow-up |
| `4cba0d8` | test(system-cron): regression guard for return value contract    | ✓ follow-up |

---

## Bug Archaeology: The macOS Activation Loop

### Root cause (pre-fix, `2d3cd2c`)

```js
// lib/server/onboarding/cron.js @ 2d3cd2c
if (status.installed) {           // ← always false on fresh darwin install
  startManagedScheduler(…);
}
return status.installed;          // ← returns false, onboarding silently succeeds
```

`getSystemCronStatus().installed` on darwin reads `kSchedulerState.active`.
`kSchedulerState.active` starts `false`. `startManagedScheduler()` is the only call
that sets it `true`. The guard was checking the postcondition before performing the
action — a classic chicken-and-egg startup bug.

### Fix (`7cfa041`)

```js
if (status.platform === "darwin" && status.enabled) {
  startManagedScheduler({ fs, openclawDir, platform });
}
```

`status.enabled` reflects the just-written config snapshot
(`cron/system-sync.json`). It is `true` immediately after
`applySystemCronConfig()` succeeds, regardless of whether the in-process
scheduler has run yet.

### Return contract tightened (`a05cbe9`)

`7cfa041` introduced a broadened return expression:

```js
// 7cfa041 — broader than needed
return status.installed || (status.platform === "darwin" && status.enabled);
```

`a05cbe9` replaces it with a precise postcondition re-read:

```js
// a05cbe9 — correct
const finalStatus = getSystemCronStatus({ fs, openclawDir, platform });
return finalStatus.installed;
```

`startManagedScheduler()` sets `kSchedulerState.active` synchronously, so the
re-read always reflects the actual runtime state before returning.

### Linux impact

`startManagedScheduler()` is darwin-only. Linux activation still flows through
`applySystemCronConfig()` writing `/etc/cron.d/openclaw-hourly-sync`.
On linux, `getSystemCronStatus().installed` reads `fs.existsSync(kSystemCronPath)`,
which is `true` immediately after the file is written. No regression on Linux.

---

## Bug Archaeology: Silent Named-Token Cron Failure

### Root cause

The managed scheduler parser calls `Number.parseInt(token)` per cron field.
Named tokens (`MON`, `SUN`, `JAN`, etc.) parse to `NaN`.
`NaN` never matches any numeric range → `cronMatchesDate()` always `false`
→ sync silently never runs.

`isValidCronSchedule()` previously only checked field count, not content.

### Fix (`2d3cd2c`, coverage in `7cfa041`)

```js
return parts.every((part) => /^[\d,*/\-]+$/.test(part));
```

Named tokens are now rejected at save time (`PUT /api/sync-cron`), returning
HTTP 400 with `{ ok: false, error: "schedule must be a 5-field cron string" }`.

---

## Resolved Concerns

All three concerns from the original PR #63 review are now resolved.

### ~~1. Broadened return contract on `installHourlyGitSyncCron()`~~ ✓ RESOLVED in `a05cbe9`

Function now returns `getSystemCronStatus({ fs, openclawDir, platform }).installed`
after `startManagedScheduler()` completes. Return value is the precise runtime
postcondition on both platforms.

### ~~2. No explicit Linux install test~~ ✓ RESOLVED in `7641a7f`

`tests/server/system-cron.test.js` now asserts:
- `kSystemCronPath` exists in the memory-fs after linux install
- Cron file content contains the default schedule
- `getSystemCronStatus()` returns `{ installed: true, installMethod: "system_cron" }`

### ~~3. No darwin disable/re-enable test~~ ✓ RESOLVED in `a7bd4b2`

Three-phase round-trip test:
1. Install on darwin → `installed: true`
2. `stopManagedScheduler()` → `installed: false`
3. Re-install on darwin → `installed: true`

### ~~4. No return value regression guard~~ ✓ RESOLVED in `4cba0d8`

Two tests assert `result === getSystemCronStatus().installed` for both `darwin`
and `linux` immediately after install. These break if the broadened expression
ever returns.

---

## Final Test Coverage

```
tests/server/system-cron.test.js
  ✓ rejects named cron tokens
  ✓ writes /etc/cron.d/openclaw-hourly-sync on linux install       ← new
  ✓ darwin: disable stops scheduler; re-enable restarts it          ← new
  ✓ return value equals getSystemCronStatus().installed on darwin   ← new
  ✓ return value equals getSystemCronStatus().installed on linux    ← new
  ✓ activates the managed scheduler after macOS install

tests/server/routes-system.test.js
  ✓ 24 tests (incl. rejects named cron tokens on PUT /api/sync-cron)

Total: 28/28 ✓  —  698 ms on Node 22.22.2
```

---

## Gateway Config Lessons (from `4d04616`, `61c8284`)

OpenClaw's gateway JSON-schema validator requires every provider entry to have
a `models` key. When alphaclaw generates config for self-hosted providers
(Ollama, LM Studio), the key is absent. Symptom: silent schema crash → 30-second
startup timeout with no clear error.

`sanitizeOpenclawConfig()` now normalizes every provider to include
`models: provider.models || []`. Edge cases hardened in `61c8284`:
array-typed providers, null provider entries.

---

## Platform / bin-path Lessons (from `3bbf43d`, `3d99697`)

On macOS, SIP makes `/usr/local/bin` root-only. The original PR placed shims
there, breaking non-root installs silently. Fix: darwin routes to `~/.local/bin`
(XDG user-space). Now enforced in `lib/platform.js::getBinPath()` with
platform-specific logic and tests.

Code review pattern that found this: "Are we assuming `/usr/local/bin` is writable?"

---

## Merge Conflict Lessons (from `99de3c0`, `ad2325f`)

When rebasing onto upstream main (`0.9.3`), three patterns caused post-merge
test failures:

1. **Wrapper vs. direct call** — `routes/system.js` called bare
   `getSystemCronStatus()` instead of the local `readSystemCronConfig()` closure
   that injects deps. Symptoms: missing argument errors in tests.

2. **Read-only guard placement** — `ensureManagedExecDefaults` was accidentally
   placed outside `!validatedReadOnlyMode`; it must not mutate `openclaw.json`
   during read-only onboarding.

3. **Duplicate call from merge** — `ensureGatewayProxyConfig` appeared twice.
   Only the guarded call inside `!validatedReadOnlyMode` should survive.

**Rule**: after any conflict resolution touching `lib/server/onboarding/index.js`,
run `npx vitest run tests/server/routes-onboarding.test.js` before pushing.

---

## Test Environment Notes

- Project requires **Node >=22.14.0** (Vitest v4 constraint).
  Node 20 causes the test runner to hang silently — not a test logic failure.
- `npm install` (full, with optionals) required for `@rollup/rollup-linux-x64-gnu`.
  If missing: `rm -rf node_modules && npm install`.
- Both targeted test files run in <800 ms total on Node 22.22.2.

---

## Pickup Instructions for Future Agents / Reviewers

### To verify everything is green

```bash
git clone https://github.com/diazMelgarejo/AlphaClaw.git alphaclaw
cd alphaclaw
git checkout pr-4-macos          # contains all surgical fixes
nvm use 22                        # Node >=22.14.0 required
npm install
npx vitest run tests/server/system-cron.test.js tests/server/routes-system.test.js
# expected: 28/28 ✓
```

### Branch map

| Branch | Purpose |
|--------|---------|
| `pr-4-macos` | Active fix branch — target of PR #63 and all surgical commits |
| `feature/MacOS-post-install` | This branch — documentation layer; rebased on top of `pr-4-macos` |

### PR reference

- PR #63 (chrysb/alphaclaw): https://github.com/chrysb/alphaclaw/pull/63
- Fork with all fixes: https://github.com/diazMelgarejo/AlphaClaw/tree/pr-4-macos
- PR #63 review comment posted: https://github.com/chrysb/alphaclaw/pull/63#issuecomment-4258187072

### What still needs upstream action

The surgical follow-up commits (`a05cbe9`–`4cba0d8`) currently live on
`diazMelgarejo/AlphaClaw:pr-4-macos`. They need to be pushed upstream to
`chrysb/alphaclaw:pr-4-macos` (or offered via a new PR) for the fix to land
in the upstream repo.
