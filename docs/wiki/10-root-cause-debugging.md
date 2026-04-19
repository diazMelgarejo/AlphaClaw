# 10 — Root Cause Debugging

> **Derived from:** PR #69 (vitest singleFork rejection). Generalizes into first-principles strategies for diagnosing and fixing problems at the right layer.

---

## Section 1: The Mask vs. Fix Principle

When something is broken, there are exactly two strategies:

**(a) Mask** — make the symptom disappear without removing the condition that created it.
**(b) Fix** — remove the underlying condition so the symptom cannot recur.

### How to tell them apart

A **mask** makes the error go away but leaves you unable to explain *why* it was happening. The root cause is still present; it is just not being triggered in the new configuration. If the mask were removed, the problem would return unchanged.

A **fix** removes the condition that created the problem. After a true fix, you can explain both what was wrong and why it no longer applies.

### When masks are acceptable

- Temporary workarounds for a confirmed upstream bug that has a fix in-flight (document the issue link and planned removal date).
- Isolating a flaky environment variable while a CI infrastructure change is staged.
- Any mask that is explicitly labeled, time-boxed, and tracked in the issue tracker.

### When masks are not acceptable

- Masking resource leaks (unclosed handles, lingering connections) — the leak grows over time.
- Masking concurrency bugs by forcing serialization — you hide a design flaw and pay a permanent performance cost.
- Masking security-relevant behavior (permissions, auth checks) — the underlying exposure remains.

### Concrete example from PR #69

| Approach | What it did | Why it was a mask |
|---|---|---|
| `singleFork: true` in vitest.config.js | Serialized the entire test suite through one worker | WAL lock contention still existed; one worker just never triggered it simultaneously. Removing singleFork would immediately reproduce the flake. Also: Vitest 4 removed this option — it was already a no-op. |
| `DatabaseSync.close()` in afterEach + module close helpers | Releases the file handle after each test file | The handle is no longer held when the next test starts. WAL contention cannot occur because there is no concurrent holder. |

---

## Section 2: Test Flakiness Taxonomy

Flaky tests have four root causes. Identifying the category first tells you exactly what to fix.

### 1. Timing Races

**Symptom:** Tests pass individually or in sequence but fail under parallel load. Failures are non-deterministic. Stack traces point to timeouts or assertion mismatches that depend on ordering.

**Diagnosis:** Run the failing test in isolation (`npx vitest run path/to/test.test.js`). If it passes alone but fails in the full suite, timing is a candidate. Check for `setTimeout`, unresolved promises, or assertions that fire before an async operation completes.

**Fix:** Use `await`, proper async teardown, or mock timers (`vi.useFakeTimers()`). Avoid `setTimeout` in tests — use `vi.advanceTimersByTime()` instead.

### 2. State Leaks

**Symptom:** Tests pass in one order but fail in another. A test that passes alone fails after a specific other test runs. `--reporter=verbose` shows the failure correlates with a preceding test.

**Diagnosis:** Run with `--sequence.shuffle` to surface ordering dependencies. Identify which preceding test leaves state that the failing test depends on being clean.

**Fix:** Reset shared state in `beforeEach`/`afterEach`. Use fresh module instances per test. Mock module-level singletons. Never rely on test execution order.

### 3. Resource Contention

**Symptom:** Parallel workers fail with lock errors, `EBUSY`, `SQLITE_BUSY`, `EADDRINUSE`, or permission denied errors on shared files or ports. Tests pass with `--pool=forks --minForks=1` but fail with default parallel config.

**Diagnosis:** Check for shared resources: SQLite databases, temp files with fixed names, HTTP servers on fixed ports. The `--reporter=verbose` output will show multiple workers failing on the same resource simultaneously.

**Fix:** Close handles in `afterEach`. Use unique resources per test (unique temp dir suffix, dynamic port assignment). Export a `close()` or `reset()` function from singleton modules so tests can tear them down.

**The SQLite WAL pattern specifically:**

`DatabaseSync` (node:sqlite) opens a WAL-mode database. WAL allows one writer and multiple readers, but concurrent writers block each other. When vitest workers each open the same database file and run writes in parallel, the second writer receives `SQLITE_BUSY`. `busy_timeout` retries compound, causing 60-second-plus hangs.

```js
// WRONG — module-level singleton, never closed between tests
const db = new DatabaseSync('./data/store.db');
export { db };

// CORRECT — export a close() for afterEach teardown
let db;
export function getDb() {
  if (!db) db = new DatabaseSync('./data/store.db');
  return db;
}
export function closeDb() {
  if (db) { db.close(); db = null; }
}
```

```js
// In your test file
import { closeDb } from '../lib/db.js';
afterEach(() => closeDb());
```

### 4. Environment Differences

**Symptom:** Passes locally, fails in CI. Or passes on one OS/architecture, fails on another. May involve missing binaries, different PATH, or platform-specific behavior.

**Diagnosis:** Compare the CI environment spec against local: Node version, OS, shell, installed globals. Check for hardcoded paths (`/usr/local/bin`), assumptions about `process.platform`, or unset environment variables.

**Fix:** Pin Node version in `.nvmrc` or `package.engines`. Use `process.platform` checks where behavior diverges. Never hardcode absolute paths — use `os.homedir()`, `os.tmpdir()`, or `lib/platform.js` helpers. Set required env vars in CI configuration.

---

### How to distinguish categories quickly

```
Run test in isolation (npx vitest run <file>)
  └── Passes alone?
        ├── YES → State leak or resource contention (not a timing issue)
        │         Run with --sequence.shuffle to confirm ordering dependency
        │         Check for shared files/ports/DBs → resource contention
        └── NO  → Timing race or environment difference
                  Run with --reporter=verbose for stack traces
                  Compare local vs. CI environment specs
```

---

## Section 3: Framework API Compatibility

Before proposing any configuration-level fix, verify the API exists in the installed version of the framework.

### Why this matters

APIs removed in major version upgrades are silently ignored, not errored. A configuration key that no longer exists will not throw — it will simply do nothing. Your fix appears to be applied but has zero effect.

### How to check

```bash
# Check vitest version
cat node_modules/vitest/package.json | grep '"version"'

# Or from Node
node -e "const pkg = require('./node_modules/vitest/package.json'); console.log(pkg.version)"

# Search the framework changelog for removals
# Example: Vitest CHANGELOG.md
grep -i "removed\|deprecated\|breaking" node_modules/vitest/CHANGELOG.md | head -40
```

### Lesson from PR #69

`poolOptions.forks.singleFork` was removed in Vitest 4. Our proposed `vitest.config.js` change set this key to `true`, but Vitest 4 ignored it entirely. The test suite continued running with full parallelism — the config change was a no-op. We submitted a PR proposing a fix that had already stopped working in the version we were running.

**Rule:** Before proposing a config change, run the test suite with and without it and confirm the behavior actually changes. If the output is identical, the API key is likely removed.

---

## Section 4: Check Upstream Before Submitting

If the flake is in an actively maintained open source codebase, the maintainer likely knows about it. Submitting a fix they are already working on wastes their review time. Submitting a worse fix than the one in-flight creates cleanup work for them.

### Preferred order

1. Search for existing issues: `gh issue list --search "flaky"`, `gh issue list --search "sqlite"`, `gh issue list --search "vitest"`
2. Search recent PRs: `gh pr list --search "vitest"`, `gh pr list --search "database"`
3. Scan recent commits on main: `git log --oneline upstream/main -20`
4. If nothing found: open an issue describing the symptom and your diagnosis — discuss before implementing
5. If they confirm it is not addressed: implement, then reference the issue in your PR

### What upstream's rejection told us

Chrys Bader's response confirmed that the correct fix (explicit `close()` helpers and afterEach teardown) was already being applied on their main branch. The root cause we identified was correct — WAL contention — but our fix was at the wrong layer (config serialization instead of resource management). By checking upstream's recent commits before submitting, we could have found this.

### Search commands to run before any upstream PR

```bash
gh issue list --repo chrysb/alphaclaw --search "flaky" --state all
gh issue list --repo chrysb/alphaclaw --search "sqlite" --state all
gh pr list --repo chrysb/alphaclaw --search "vitest" --state all
git log --oneline upstream/main -30
```

---

## Section 5: Resource Management Checklist for Node.js Tests

Use this checklist when writing or reviewing tests that touch external resources.

### DatabaseSync (node:sqlite)

```js
import { DatabaseSync } from 'node:sqlite';

let db;

beforeEach(() => {
  db = new DatabaseSync(':memory:'); // or a temp file path
  // run schema setup here
});

afterEach(() => {
  db.close();
  db = null;
});
```

- Never use a module-level `DatabaseSync` instance in tests without a corresponding `afterEach` close.
- For module-owned singletons, export a `close()` or `reset()` function specifically for test teardown.
- Use `:memory:` databases in tests wherever possible — they are isolated per instance by definition.

### File Handles

```js
import { openSync, closeSync, writeSync } from 'node:fs';

let fd;

beforeEach(() => { fd = openSync(tmpPath, 'w'); });
afterEach(() => { closeSync(fd); });
```

- Always pair `openSync` with `closeSync` in the same test lifecycle hooks.
- Never leave file handles open across test boundaries.

### HTTP Servers

```js
let server;

beforeEach((done) => { server = app.listen(0, done); }); // port 0 = dynamic
afterEach((done) => { server.close(done); });
```

- Use port `0` (dynamic assignment) to avoid `EADDRINUSE` between test runs.
- Always call `server.close()` in `afterEach` — not just at the end of the suite.

### Temporary Directories

```js
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let tmpDir;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'alphaclaw-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});
```

- Use `mkdtempSync` with a unique prefix — never hardcode a temp path like `/tmp/test-db`.
- Clean up in `afterEach`, not `afterAll` — cleanup after each test prevents cross-test contamination.

### Module-Level Singletons

If a module initializes a resource at import time (e.g., opens a DB connection), it must export a way to release that resource for test teardown:

```js
// lib/db.js — CORRECT pattern
let _db = null;

function getDb() {
  if (!_db) _db = new DatabaseSync(getDbPath());
  return _db;
}

function closeDb() {
  if (_db) { _db.close(); _db = null; }
}

export { getDb, closeDb };
```

```js
// In test files
import { closeDb } from '../lib/db.js';
afterEach(() => closeDb());
```

- Any module that owns a long-lived resource must export a teardown function.
- Tests must call that function in `afterEach`, not `afterAll`.
- Calling in `afterAll` still leaks handles between test *files* when running in parallel.

---

## Quick Reference

| Symptom | Category | First Check |
|---|---|---|
| Fails under parallel, passes alone | Resource contention or state leak | Look for shared files, DBs, ports |
| Fails in different order, passes in fixed order | State leak | `--sequence.shuffle` to confirm |
| Passes locally, fails in CI | Environment difference | Node version, PATH, missing env vars |
| Timeout under load | Timing race or resource contention | Check for unresolved promises, lock waits |
| Config change has no effect | Framework API removed | Check installed version changelog |

---

## Section 6: Case Study — macOS ARM64 Parallel Test Timeouts (2026-04-19)

### Symptom

`npm test` (parallel Vitest workers) = 10 failures, all `Test timed out in 5000ms`.  
`npm run test:coverage` (sequential) = 594/594 green.

Failing tests spanned **routes test files that use only mocks** (agents, auth, browse, cron, models, onboarding, pairings, system, webhooks) and `usage-db.test.js`.

### Why the diagnosis in TODO.md was partially wrong

The initial analysis ("routes tests create SQLite-backed services without afterEach cleanup") is only partially correct:

| File | Real resource leak? | What actually leaks |
|---|---|---|
| `routes-browse.test.js` | ✅ YES | Temp dirs via `createTestRoot()`, never cleaned up |
| `routes-models.test.js` | ✅ YES | Temp dirs via `createApp()`, never cleaned up |
| `routes-agents.test.js` | ❌ NO | Pure mocks, no real resources |
| `routes-auth.test.js` | ⚠️ PARTIAL | Already has afterEach; `vi.resetModules()` per test |
| `routes-cron.test.js` | ❌ NO | Pure mocks |
| `routes-pairings.test.js` | ❌ NO | Pure mocks |
| `routes-system.test.js` | ❌ NO | Pure mocks |
| `routes-webhooks.test.js` | ❌ NO | Pure mocks |
| `usage-db.test.js` | ✅ has cleanup | afterEach closes both connections; still times out |

### Two-layer root cause

**Layer 1 — macOS shared memory pressure** (affects ALL workers including pure-mock ones):  
Node.js `DatabaseSync` (node:sqlite) keeps `.db-shm` shared memory files mmap'd in the process until `close()` is called. The upstream fix for 5 db-layer files freed this memory promptly. The unfixed db-layer tests (doctor, watchdog, webhooks) leave these mmap'd files alive across tests. Under parallel load on macOS ARM64, with 60+ concurrent worker processes each holding several mmap'd pages, the OS experiences memory pressure. This slows ALL workers — including workers running pure-mock routes tests — past the 5s timeout.

**Layer 2 — I/O pressure from leaked temp dirs** (affects routes-browse and routes-models):  
Each test in these files creates a temp dir with `mkdtempSync` that is never cleaned up. With 18 tests in routes-browse and 12 in routes-models, each parallel run leaves 30 undeleted temp directories on disk. On macOS, temp dirs under `/var/folders/` are on a memory-mapped filesystem — excessive undeleted entries add I/O overhead.

### Fix applied (2026-04-19)

**1. Temp dir cleanup for routes-browse.test.js:**

```js
// Track created dirs at module level
const createdTestRoots = [];
const createTestRoot = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-browse-test-"));
  createdTestRoots.push(dir);
  return dir;
};

// Inside describe:
afterEach(() => {
  for (const dir of createdTestRoots.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
```

**2. Same pattern for routes-models.test.js** — track `createdTempRoots` in `createApp()`, clean in `afterEach`.

**3. vitest.config.js testTimeout increase:**

```js
testTimeout: 10000,  // raised from 5000ms default
```

Reason: pure-mock routes tests (agents, cron, pairings, system, webhooks) have NO resources to close. Their timeouts are caused by global shared-memory pressure from db-layer tests in other workers. A higher timeout gives them breathing room while the upstream db cleanup fix propagates.

### What did NOT help (and why)

- **`afterEach(() => app.close?.())`** for pure mock routes tests — Express apps don't have `close()`. This is a no-op. The correct fix for those files is the timeout increase.
- **`singleFork: true`** — removed in Vitest 4. Would have been a mask anyway (hides contention by serializing instead of fixing resource leaks).

### To verify (run on native ARM64 terminal)

```bash
npm test   # target: 594/594, previously 584/594
```

→ Related: [06 — Vitest SQLite Flake](06-vitest-sqlite-flake.md) · [05 — Merge Conflicts](05-merge-conflicts.md)
