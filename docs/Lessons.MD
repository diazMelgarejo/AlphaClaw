
# Lessons

> **For agents:** Read this at session start. Every lesson here was earned from a real bug or real lost time.
> **For humans:** Each row links to the wiki article that owns the details.
> For agent behavioral rules see **[SKILL.md →](../SKILL.md)**

---

## Session 2026-04-13 — macOS PR Implementation

| Topic | What happened | Details |
|---|---|---|
| macOS bin-path | SIP blocks `/usr/local/bin`; shims go to `~/.local/bin` via `getBinPath()` | → [wiki/02](wiki/02-macos-bin-path.md) |
| Gateway config | Missing `models:[]` in `openclaw.json` → 30s silent timeout; `sanitizeOpenclawConfig()` required | → [wiki/03](wiki/03-gateway-config.md) |
| Cron / scheduler | `/etc/cron.d` root-only on macOS; named tokens crash parser; use managed scheduler | → [wiki/04](wiki/04-cron-scheduler.md) |
| Merge conflicts | 3 patterns: wrapper/direct call, read-only guard placement, duplicate calls | → [wiki/05](wiki/05-merge-conflicts.md) |

---

## Session 2026-04-15 — Windows Dev Environment Setup

| Topic | What happened | Details |
|---|---|---|
| Windows launcher | Anchored Node/npm to LM Studio bin; resolved git from GitHub Desktop; never symlink versioned install dirs | → [wiki/11](wiki/11-windows-dev.md) |

---

## Session 2026-04-16 — Duplicate Cleanup, Vitest, Upstream 0.9.8

| Topic | What happened | Details |
|---|---|---|
| Duplicate files | macOS "keep both" silently created `platform 2.js`, `platform 3.js` in git | → [wiki/07](wiki/07-duplicate-files.md) |
| Vitest WAL flake | Parallel workers race on SQLite WAL locks → 60s+ hangs; proposed `singleFork` (later rejected) | → [wiki/06](wiki/06-vitest-sqlite-flake.md) |
| Subagent bash | Dispatched agents don't inherit parent Bash grants; shell work stays in parent session | → [wiki/08](wiki/08-subagent-bash-permissions.md) |

---

## Session 2026-04-18 — PR #69 Rejection, Upstream 0.9.9 Merge

| Topic | What happened | Details |
|---|---|---|
| PR #69 rejected | `singleFork` was a mask (WAL contention still existed) AND a no-op (Vitest 4 removed it) | → [wiki/10](wiki/10-root-cause-debugging.md) |
| ENV refactor | Upstream added `HOME:kRootDir`; `OPENCLAW_HOME` shifted; `OPENCLAW_STATE_DIR` carries old value | → [wiki/05](wiki/05-merge-conflicts.md) Pattern 4 |
| Rebase + autostash | `git rebase --autostash` required when rebasing over a merge commit | → [wiki/09](wiki/09-session-checklist.md) |

---

## Session 2026-04-19 — Build & Test Run (macOS arm64)

| Topic | What happened | Details |
|---|---|---|
| npm parallel race | Simultaneous `npm install` background jobs → ENOTEMPTY on staging dir; fix: `rm -rf node_modules/@chrysb/.alphaclaw-HgyXfxzk` | → [build-errors-macos.md](build-errors-macos.md) |
| SQLite WAL timeouts | 10/594 tests timeout @ 5000ms in `npm test` (parallel); 0 failures in `npm run test:coverage` (sequential) — confirms WAL contention, not logic bugs | → [wiki/06](wiki/06-vitest-sqlite-flake.md), [wiki/10](wiki/10-root-cause-debugging.md) |
| xcrun mcpbridge missing | CLT only, not Xcode.app; xcode MCP server fails to connect; non-blocking | → [build-errors-macos.md](build-errors-macos.md) |
| npm audit 20 vulns | 4 critical (WhatsApp/protobuf), 12 high (Discord); all in channel deps, none in macOS port path | → [build-errors-macos.md](build-errors-macos.md) |

---

## Wiki Index

| # | Page | Topic |
|---|---|---|
| 01 | [Branch Roles](wiki/01-branch-roles.md) | 4-branch workflow, data flow |
| 02 | [macOS Bin-Path](wiki/02-macos-bin-path.md) | SIP, `~/.local/bin`, `getBinPath()` |
| 03 | [Gateway Config](wiki/03-gateway-config.md) | `models:[]`, `sanitizeOpenclawConfig()` |
| 04 | [Cron / Scheduler](wiki/04-cron-scheduler.md) | LaunchAgent, named token rejection |
| 05 | [Merge Conflicts](wiki/05-merge-conflicts.md) | 4 patterns, read-only guard invariant |
| 06 | [Vitest SQLite Flake](wiki/06-vitest-sqlite-flake.md) | WAL locks, `singleFork` history (rejected) |
| 07 | [Duplicate Files](wiki/07-duplicate-files.md) | macOS "keep both", dupe check command |
| 08 | [Subagent Bash](wiki/08-subagent-bash-permissions.md) | Permission inheritance gotcha |
| 09 | [Session Checklist](wiki/09-session-checklist.md) | Full startup/shutdown command sequence |
| 10 | [Root Cause Debugging](wiki/10-root-cause-debugging.md) | Mask vs fix, flakiness taxonomy, resource management |

---

## Cross-Repo Lesson Links

AlphaClaw is Layer 1 (infra). orama-system (L3) and Perpetua-Tools (L2) share the same macOS/git environment and accumulate complementary lessons. Check sister docs when a problem feels familiar.

| Topic | AlphaClaw doc | Sister doc |
|-------|---------------|------------|
| macOS ` 2`/` 3` duplicate files + `.git` internals | [wiki/07-duplicate-files.md](wiki/07-duplicate-files.md) | `orama-system/docs/LESSONS.md` §2026-05-27 "macOS ghost git refs" + `orama-system/scripts/review/repo_hygiene.py::scan_macos_ghost_git_refs()` |
| Migration gate ladder (Gate 0→1→2→3→4) | N/A (AlphaClaw is target, not migrator) | Perpetua-Tools `docs/MIGRATION.md` (canonical) |
| No sleep chains (`sleep N && cmd` blocked) | N/A (shell-level rule, Node project) | `orama-system/bin/orama-system/skills/no-sleep-chains/SKILL.md` |
| Git identity + Cursor agent commit policy | `scripts/git/check_identity.sh` (Cursor-scoped 2026-05-31) | `orama-system/docs/wiki/08-git-hygiene-and-branching.md` (canonical policy) |
| gbrain / tooling ops | N/A | `orama-system/bin/orama-system/gstack/SKILL.md` §GBrain Ops |

**Quick paths** (relative from this repo root):
- orama lessons: `../orama-system/docs/LESSONS.md`
- PT lessons + migration: `../perplexity-api/Perpetua-Tools/docs/LESSONS.md` / `../perplexity-api/Perpetua-Tools/docs/MIGRATION.md`

---

## Session 2026-07-31 — Upstream sync, garrytan cherry-pick, macOS CI cron fix

| Topic | What happened | Details |
|---|---|---|
| Upstream sync PR #22 | Merged `chrysb/main` into `feature/MacOS-post-install` with garrytan safe-mode cherry-pick + `@diazmelgarejo/alphaclaw@0.9.33.9` | → [wiki/01](wiki/01-branch-roles.md) |
| Cherry-pick hygiene | Conflict markers left in `vitest.config.js` at first attempt — history rewritten before merge | → [wiki/05](wiki/05-merge-conflicts.md) |
| macOS CI cron test | `onboarding-cron.test.js` failed on `macos-latest` only: asserted `/etc/cron.d/` write without `platform: "linux"` | → [wiki/04](wiki/04-cron-scheduler.md) § CI failure |
| Apex DMG URL | `updates.alphaclaw.md/desktop/prod/alphaclaw-mac-latest.dmg` is AlphaClaw Apex (Electron), not npm harness — private `alphaclaw-nexus` build | N/A (commercial desktop, separate from fork) |
| Gate-2 D3 status | PT absorbed MCP/agents into packages; `lib/mcp` + `lib/agents` on feature branch **not** retired yet | → PT alignment plan |

---

## Session 2026-05-31 — Migration audit, Gate-2 status, dedup

| Topic | What happened | Details |
|---|---|---|
| Migration audit | PT has **absorbed** AlphaClaw's MCP+agents: `lib/mcp`(11 tools)→`packages/alphaclaw-mcp`(14), `lib/agents`→`packages/local-agents`. But overarching goal is **Gate-2 partial** (8 gaps); **do NOT delete `lib/mcp`+`lib/agents` yet** | → PT [alignment plan](../../perplexity-api/Perpetua-Tools/docs/2026-05-31-tri-repo-alignment-completion-plan.md) + [steelman](gate2-lib-mcp-deletion-steelman.md) |
| Gate-2 live test | `npm install`+`build:ui`+server boot all GREEN on macOS arm64; adapter HTTP transport alive. Auth-gated 14-tool smoke-test still unproven (needs the user's `~/.alphaclaw` SETUP_PASSWORD — never hardcode) | run in MAIN session (subagent Bash can't do npm/node) |
| `.mcp.json` dependency | registers `lib/mcp/alphaclaw-mcp.js` — must be repointed/removed when that file is retired | → [steelman](gate2-lib-mcp-deletion-steelman.md) |
| Package rename | `@chrysb/alphaclaw` → `@diazmelgarejo/alphaclaw` on feature branch (`d9087ef`) | feature only, never pr-4-macos |
| macOS ` 2` dups | quarantined repo-wide to `~/dup-quarantine-2026-05-31` (NOT OneDrive/iCloud — historical Finder/IDE) | → [wiki/07](wiki/07-duplicate-files.md) |
