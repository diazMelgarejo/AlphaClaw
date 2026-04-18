
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
