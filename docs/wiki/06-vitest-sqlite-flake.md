# 06. Vitest + SQLite WAL Lock Flake

**TL;DR:** Multiple vitest workers opening `DatabaseSync` connections to WAL-mode SQLite files simultaneously race for write locks, causing 60s+ timeouts. Fix: `singleFork: true` in `vitest.config.js`.

---

## Root Cause

`node:sqlite`'s `DatabaseSync` uses WAL (Write-Ahead Log) mode. With `PRAGMA busy_timeout=5000`, a blocked write will retry for 5s before failing — but under parallel vitest workers, multiple retries cascade, causing a single test to hang for 60+ seconds before hitting vitest's 5000ms per-test timeout (which is separate from SQLite's retry timeout).

The affected test: `tests/server/usage-db.test.js` — "sums per-model costs for session detail totals". It passed in 44ms when run alone but timed out at 63s in the full suite.

---

## Fix

`vitest.config.js`:

```js
export default defineConfig({
  test: {
    // ... existing config ...
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,  // all test files share one process → no WAL races
      },
    },
  },
});
```

**Effect:** All test files run in sequence in one forked process. No concurrent `DatabaseSync` connections. Suite time: 64s → 7s.

**No test isolation lost:** Vitest still isolates each test file via module cache clearing. The only thing removed is worker-level parallelism — which was causing the race.

---

## Diagnosis Steps (if a new SQLite flake appears)

1. Run the failing test in isolation: `npx vitest run tests/server/usage-db.test.js`
   - If it passes fast → it's a concurrency/WAL issue
   - If it fails → it's a logic bug in the test or module

2. Check if `singleFork: true` is still in `vitest.config.js`

3. Check for any new test file that opens `DatabaseSync` without going through `initUsageDb` — it might be bypassing WAL mode setup and leaving connections open.

---

## Rule

**`singleFork: true` must remain in `vitest.config.js`.** Do not remove it to "improve parallelism" — the SQLite WAL races will return immediately.

If a future contributor asks why, point them here.

---

## Upstream Impact

This fix was submitted to `chrysb/alphaclaw` as PR #69 and applies to all platforms, not just macOS.

---

## Related

- `vitest.config.js` at repo root
- PR #69 (chrysb/alphaclaw): fix(test): resolve flaky usage-db timeout via vitest singleFork
- [2026-04-16 session log](../superpowers/plans/2026-04-16-session-lessons.md)
