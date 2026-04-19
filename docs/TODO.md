# AlphaClaw macOS Port — Master TODO

> Last updated: 2026-04-19 | Branches: `pr-4-macos` / `feature/MacOS-post-install`

---

## ✅ COMPLETED

- [x] **E.1** `optionalDependencies` `@esbuild/darwin-arm64` + `@esbuild/darwin-x64` 0.25.x → `package.json`
- [x] **E.2** darwin npm prefix advisory on `alphaclaw start` → `bin/alphaclaw.js` (line ~594)
- [x] **E.3** LaunchAgent plist writer replaces `/etc/cron.d` on darwin → `bin/alphaclaw.js` + `lib/scripts/macos-hourly-sync.plist.template`
- [x] **E.4** ENOTEMPTY protocol documented → `scripts/setup-macos-sandbox.sh` (clean-install + lsof diagnostic)
- [x] **E.5** CI matrix `ubuntu-latest` + `macos-latest`, watchdog + coverage → `.github/workflows/ci.yml`
- [x] **F.2** npm registry scope `@chrysb` → `@diazmelgarejo` → `.npmrc`
- [x] **F.3** patch-package label `[@chrysb/alphaclaw]` → `[@diazmelgarejo/alphaclaw]` → `scripts/apply-openclaw-patches.js`
- [x] `.mcp.json` — project-level MCP config (`xcrun mcpbridge` + `alphaclaw-mcp`)
- [x] `scripts/fix-xcode-claude.sh` — clears stale sessions, registers mcpbridge, creates CodingAssistant config
- [x] `scripts/setup-macos-sandbox.sh` — full ARM64 sandbox setup + smoke test runner
- [x] `docs/xcode-claude-integration.md` — Xcode 26.3 BETA integration guide
- [x] `lib/mcp/alphaclaw-mcp.js` — AlphaClaw MCP server (11 tools: status, config, providers, logs, env, build, test + 4 local-agent tools) — syntax ✓
- [x] `lib/agents/local-agent-client.js` — Ollama (127.0.0.1:11435, GLM-5.1:cloud → qwen3.5-local:latest fallback) + LM Studio (192.168.254.101:1234) client — no external deps, syntax ✓
- [x] `lib/agents/orchestrator.js` — Claude-as-planner / local-agent-as-worker pattern (code Q&A, patch proposals, dir review) — syntax ✓
- [x] `bin/alphaclaw.js` syntax check ✓
- [x] `lib/mcp/alphaclaw-mcp.js` syntax check ✓

---

## 🤖 LOCAL AGENT ORCHESTRATION (new)

Ollama + LM Studio are wired as coding subagents. Claude = orchestrator/planner.

### Architecture

```
Claude (main)                    Local Agents
──────────────────               ────────────────────────────────
Plans, reviews, applies    ←→    Reads files, proposes patches
MCP: local_agent_*               Ollama  127.0.0.1:11435
                                   models: GLM-5.1:cloud (primary)
                                           qwen3.5-local:latest (fallback)
                                 LM Studio  192.168.254.101:1234
                                   model: whatever is loaded
```

### New MCP tools (available to Claude Code in Xcode/VS Code)

```
local_agent_health           — check Ollama + LM Studio reachability
local_agent_list_models      — list all loaded models on both backends
local_agent_ask_about_code   — delegate file reading + Q&A to local agent
local_agent_propose_edit     — get a unified diff from local agent (Claude reviews before applying)
```

### Quick test (run on your Mac after `bash scripts/fix-xcode-claude.sh`)

```bash
# In Claude Code:
# > Use local_agent_health to check which agents are running
# > Use local_agent_ask_about_code on lib/platform.js: "Where does getBinPath return for darwin?"
# > Use local_agent_propose_edit on bin/alphaclaw.js: "Add better error message when SETUP_PASSWORD is missing"
```

### Environment overrides (.env or shell)

```bash
OLLAMA_BASE_URL=http://127.0.0.1:11435         # default
OLLAMA_MODELS=GLM-5.1:cloud,qwen3.5-local:latest  # comma-sep preference list
OLLAMA_TIMEOUT_MS=30000
LMSTUDIO_BASE_URL=http://192.168.254.101:1234  # default
LMSTUDIO_TIMEOUT_MS=30000
```

---

## 🖥️ RUN THESE ON YOUR MAC (not in sandbox)

The sandbox uses a FUSE mount that blocks ESM reads (errno -35). Run in a **native ARM64 Terminal**:

```bash
cd ~/Documents/Terminal\ xCode/claude/OpenClaw/AlphaClaw

# ── Step 1: Fix Xcode Claude integration ──────────────────────────────────
bash scripts/fix-xcode-claude.sh

# ── Step 2: Install deps ───────────────────────────────────────────────────
npm install          # picks up @esbuild/darwin-arm64 optional dep
# NOTE: run only once — parallel invocations → ENOTEMPTY on staging dir

# ── Step 3: Build UI ──────────────────────────────────────────────────────
npm run build:ui     # ✓ must exit 0 — app.bundle.js ~986KB

# ── Step 4: Full test suite ────────────────────────────────────────────────
npm test             # 584/594 pass (10 SQLite WAL timeouts in parallel — see Known Issues)
# OR use coverage for a clean 594/594 green run:
npm run test:coverage   # ✓ 594/594 — sequential runner avoids WAL contention

# ── Step 5: Watchdog tests ────────────────────────────────────────────────
npm run test:watchdog   # ✓ 29/29 green

# ── Step 6: Register AlphaClaw MCP server ─────────────────────────────────
claude mcp add --transport stdio alphaclaw -- node lib/mcp/alphaclaw-mcp.js
claude mcp list   # should show: xcode, alphaclaw

# ── Step 7: Smoke test ────────────────────────────────────────────────────
echo "SETUP_PASSWORD=localdev123" > .env
node bin/alphaclaw.js start
# ✓ [alphaclaw] LaunchAgent installed (not /etc/cron.d)
# ✓ ~/.local/bin/gog installed (not /usr/local/bin)
# ✓ http://localhost:3000 responds
```

---

## ⚠️ KNOWN ISSUES

### SQLite WAL timeouts in routes tests (parallel mode)

**Status:** Open — upstream fix is partial.

`npm test` (parallel workers) fails 10/594 tests with `Test timed out in 5000ms`. All 594 pass in `npm run test:coverage` (sequential runner).

**What upstream fixed:** `092df06 fix(test): close leaked sqlite handles in db tests` (2026-04-17) added `afterEach(() => db.close())` to 5 db-layer test files. This commit **is already in `pr-4-macos`** (pulled via the 0.9.9 merge `ff7f9d2`).

**What remains:** The 9 routes test files were **not** covered by `092df06`. They create full Express apps with SQLite-backed services but have no `afterEach` cleanup:

| Test file | Missing cleanup |
|---|---|
| `tests/server/routes-agents.test.js` | no `afterEach`/`close` |
| `tests/server/routes-auth.test.js` | partial only |
| `tests/server/routes-browse.test.js` | partial only |
| `tests/server/routes-cron.test.js` | no `afterEach`/`close` |
| `tests/server/routes-models.test.js` | no `afterEach`/`close` |
| `tests/server/routes-pairings.test.js` | no `afterEach`/`close` |
| `tests/server/routes-system.test.js` | no `afterEach`/`close` |
| `tests/server/routes-webhooks.test.js` | no `afterEach`/`close` |
| `tests/server/usage-db.test.js` | fix present but one test still cascades |

**Next action:** Add `afterEach(() => app.close?.())` or equivalent db teardown to each affected file. This is a candidate for a follow-up PR to upstream.

See [docs/build-errors-macos.md](build-errors-macos.md) for full run log.

---

## 📋 REMAINING (feature/MacOS-post-install branch only)

### F.1 — package.json rename + version bump

**⚠️ NEVER apply to `pr-4-macos`. Feature branch only.**

```bash
git checkout feature/MacOS-post-install
```

Edit `package.json`:

| Field | Before | After |
|---|---|---|
| `name` | `@chrysb/alphaclaw` | `@diazmelgarejo/alphaclaw` |
| `version` | `0.9.9` | `0.9.9.6` |
| `repository.url` | `https://github.com/chrysb/alphaclaw.git` | `https://github.com/diazmelgarejo/alphaclaw` |

### F.4 — npm publish (after F.1)

```bash
npm whoami          # must print "diazmelgarejo"
npm pack --dry-run  # verify: bin/, lib/, patches/, scripts/apply-openclaw-patches.js
npm publish --access public
```

### Xcode 26.3 BETA — final wiring

After running `fix-xcode-claude.sh`:

- Install full **Xcode 26.5+** from App Store (only CLT is currently installed — `xcrun mcpbridge` requires the Xcode app)
- Settings → Intelligence → Model Context Protocol → **"Allow external agents to use Xcode tools"**: ON
- Re-run `bash scripts/fix-xcode-claude.sh` — xcode MCP server should then connect

### Branch management (end of session)

```bash
# Commit all changes on current branch
git add -A
git commit -m "feat(macos): E.1-E.5 esbuild/LaunchAgent/CI + MCP server + xcode integration"
git push origin pr-4-macos

# Sync to feature/MacOS-post-install
git checkout feature/MacOS-post-install
git cherry-pick <commit-hash-from-above>
# Then apply F.1 name/version bump + commit
git push origin feature/MacOS-post-install --force-with-lease
```

---

## 🔒 INVARIANTS — Never break these

| Rule | File |
|---|---|
| No writes to `/usr/local/bin` on darwin | `lib/platform.js` → `~/.local/bin` |
| No writes to `/etc/cron.d` on darwin | `bin/alphaclaw.js` E.3 → `~/Library/LaunchAgents/` |
| No version bump on `pr-4-macos` | version follows upstream chrysb/alphaclaw |
| `SETUP_PASSWORD` is a security gate | Put in `.env`, never bypass |
| `sanitizeOpenclawConfig()` before gateway spawn | models:[] guard |
| Read-only onboarding guard | `lib/server/onboarding/index.js` |
| `~/.npmrc` auth token never committed | covered by `.gitignore` |

---

## 📡 UPSTREAM / MAINLINE NOTES

> **Out of scope for our macOS PR.** Items here are observations to share with `chrysb/alphaclaw` upstream, not work tracked for this fork.

### npm audit — 20 vulnerabilities (as of 2026-04-19, v0.9.9)

Running `npm audit` on a clean install reports:

| Severity | Count | Key packages |
| -------- | ----- | ------------ |
| Critical | 4 | `@whiskeysockets/baileys`, `@whiskeysockets/libsignal-node`, `openclaw`, `protobufjs` |
| High | 12 | `@chrysb/alphaclaw`, `@discordjs/node-pre-gyp`, `@discordjs/opus`, `@discordjs/voice`, `@buape/carbon` |
| Moderate | 4 | `axios`, `hono`, `follow-redirects`, `@larksuiteoapi/node-sdk` |

**Assessment:** All critical/high vulnerabilities are in messaging channel dependencies (WhatsApp Baileys, Discord.js) or their transitive deps. None are in the macOS port code path. No immediate user-facing risk unless the WhatsApp or Discord channels are actively used with untrusted input.

**Suggested upstream action:** Run `npm audit fix` where possible; for Baileys/libsignal, check if a newer version of `@whiskeysockets/baileys` has been released with patched deps, or pin to a safe sub-dependency version.

### SQLite WAL fix is incomplete upstream

`092df06 fix(test): close leaked sqlite handles in db tests` (upstream, 2026-04-17) fixed 5 db test files but left 9 routes test files without `afterEach` cleanup. The routes tests time out in parallel mode (`npm test`) but pass sequentially (`npm run test:coverage`). A follow-up fix covering the routes test files would make `npm test` fully green.
