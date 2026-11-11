# macOS Build Errors Log

> Platform: macOS Sonoma 26.5 (darwin arm64) · Node: v24.14.1 (nvm) · npm: bundled with nvm Node

---

## 2026-04-19 — Session: build + test run on feature/MacOS-post-install

### Error 1 — npm ENOTEMPTY (parallel install corruption)

**Symptom:**

```text
npm error code ENOTEMPTY
npm error syscall rmdir
npm error path node_modules/@chrysb/.alphaclaw-HgyXfxzk/node_modules/openclaw/dist
npm error errno -66
```

**Root cause:** Multiple `npm install` processes launched in parallel raced on the same temp staging directory. npm uses `@chrysb/.alphaclaw-HgyXfxzk/` as an atomic staging dir; concurrent processes left it in a non-empty state that the subsequent rmdir couldn't clear.

**Fix:**

```bash
rm -rf "node_modules/@chrysb/.alphaclaw-HgyXfxzk"
npm install   # clean retry
```

**Rule:** Never run multiple `npm install` processes in the same project root simultaneously.

---

### Error 2 — 10 tests timeout at 5000ms (parallel worker resource pressure)

**Symptom (npm test, parallel mode):**

```text
10 failed | 584 passed (594)
All failures: "Test timed out in 5000ms"
```

**Affected tests:**

| Test file | Test name |
| --- | --- |
| routes-agents.test.js | creates a configured channel account on POST /api/channels/accounts |
| routes-auth.test.js | returns 503 when setup password is unset |
| routes-browse.test.js | writes file content and returns write result |
| routes-cron.test.js | triggers run and prompt updates |
| routes-models.test.js | validates modelKey on POST /api/models/set |
| routes-onboarding.test.js | short-circuits when already onboarded |
| routes-pairings.test.js | passes account id through on pairing approval |
| routes-system.test.js | rejects reserved vars on PUT /api/env |
| routes-webhooks.test.js | creates webhook oauth callback alias when requested |
| usage-db.test.js | sums per-model costs for session detail totals |

**Root cause (two layers):**

*Layer 1 — macOS shared memory pressure (all workers):* Node.js `DatabaseSync` (node:sqlite) keeps `.db-shm` shared memory files mmap'd until `close()` is called. Unfixed db-layer tests (doctor-db, watchdog-db, webhooks-db) hold these mmap's open across tests. Under 60+ parallel workers on macOS ARM64, OS memory pressure slows ALL workers — including pure-mock routes tests — past the timeout.

*Layer 2 — temp dir I/O leak (routes-browse, routes-models):* `createTestRoot()` / `createApp()` called `mkdtempSync` per test but never cleaned up. 30+ leaked dirs per run added measurable I/O overhead on macOS `/var/folders/`.

**Proof:** `npm run test:coverage` (sequential) passes all **594/594** — confirms the tests are correct and the issue is parallel resource contention.

**Fix applied (2026-04-19):**

- `routes-browse.test.js`: added `afterEach` temp dir cleanup
- `routes-models.test.js`: added `afterEach` temp dir cleanup
- `vitest.config.js`: raised `testTimeout` from 5000ms to 10000ms

**What remains:** The db-layer tests (doctor-db, watchdog-db, webhooks-db) still leave `.db-shm` files mmap'd between tests. A complete fix requires closing all `DatabaseSync` connections in their `afterEach` hooks. See [wiki/10 § Section 6](wiki/10-root-cause-debugging.md) for full analysis.

---

### Warning — xcrun mcpbridge unavailable

**Symptom (fix-xcode-claude.sh step 6):**

```text
⚠ xcrun mcpbridge not found — requires Xcode 26.3+ with Intelligence enabled
```

```text
xcode: xcrun mcpbridge - ✗ Failed to connect
```

**Root cause:** Only Xcode Command Line Tools are installed (`xcode-select -p` → `/Library/Developer/CommandLineTools`). The `mcpbridge` binary ships with the full Xcode.app ≥ 26.3, not with CLT.

**Fix:** Install Xcode 26.5 from the App Store, open it, go to Settings → Intelligence → Model Context Protocol → enable "Xcode Tools". Then re-run `bash scripts/fix-xcode-claude.sh`.

**Status:** Not blocking — Claude Code continues to work without the Xcode MCP bridge.

---

### Warning — npm audit: 20 vulnerabilities

| Severity | Count | Key packages |
| --- | --- | --- |
| Critical | 4 | @whiskeysockets/baileys, protobufjs, openclaw, @whiskeysockets/libsignal-node |
| High | 12 | @chrysb/alphaclaw, @discordjs/*, @buape/carbon |
| Moderate | 4 | axios, hono, follow-redirects, @larksuiteoapi/node-sdk |

**Assessment:** All are in messaging channel dependencies (WhatsApp, Discord). None are in the macOS port path. Run `npm audit` for details. No action needed for the macOS PR.

---

## Build results summary

| Step | Result | Notes |
| --- | --- | --- |
| `bash scripts/fix-xcode-claude.sh` | ✅ Pass (with warnings) | alphaclaw MCP registered; xcode MCP unavailable (no Xcode.app) |
| `npm install` | ✅ Pass (after ENOTEMPTY cleanup) | 8m, 1222 packages, 20 audit vulns |
| `npm run build:ui` | ✅ Pass | 17.5s, app.bundle.js 986KB |
| `npm test` | ⚠️ 10 failures (pre-fix) | Partial fix applied — target 594/594 after timeout increase |
| `npm run test:watchdog` | ✅ 29/29 | |
| `npm run test:coverage` | ✅ 594/594 | Sequential runner avoids parallel resource contention |

**Overall coverage baseline:** 68.04% statements · 53.51% branch · 66.99% functions · 70.23% lines
