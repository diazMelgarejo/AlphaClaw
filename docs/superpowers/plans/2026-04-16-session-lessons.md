# Session Lessons — 2026-04-16

## What Happened This Session

### 1. Duplicate File Cleanup

macOS's "keep both" behavior created numbered copies of tracked files:

```
CLAUDE 2.md, .mcp 2.json, lib/platform 2.js, lib/platform 3.js,
lib/server/onboarding/state 2.js, lib/server/system-cron 2.js (and 3),
scripts/fix-xcode-claude 2.sh, scripts/setup-macos-sandbox 2.sh,
docs/xcode-claude-integration 2.md,
tests/server/platform.test 2.js, tests/server/platform.test 3.js
```

**Key finding:** `lib/platform.js` and `tests/server/platform.test.js` did NOT exist as canonical files — only as `*2.js` / `*3.js` copies. They were renamed into their correct names and the extras deleted.

**Rule going forward:** Never use Finder to move/copy tracked files. Use `git mv` or terminal commands only. Run `find . -name "* 2.*" -o -name "* 3.*" | grep -v node_modules | grep -v .git` as a periodic sanity check.

---

### 2. Flaky Test: usage-db "sums per-model costs for session detail totals"

**Symptom:** `tests/server/usage-db.test.js` intermittently timed out at 63s during the full suite run, but passed in 44ms when run in isolation.

**Root cause:** vitest's default parallel worker pool runs test files in concurrent child processes. Multiple test files open `DatabaseSync` (`node:sqlite`) connections to WAL-mode SQLite databases. When workers race for WAL write locks, `PRAGMA busy_timeout=5000` causes retries that cascade into a 60s+ hang.

**Fix:** `vitest.config.js` — add `pool: "forks"` + `poolOptions.forks.singleFork: true`. All test files share one process; SQLite connections are serialized. Suite time: 64s → 7s.

**Submitted upstream:** chrysb/alphaclaw#69

**Committed to:**
- `fix/vitest-singlefork-sqlite-flake` (branch off main, open PR)
- `pr-4-macos` (commit dd2281f)

---

### 3. Main Upstream Was 22 Commits Ahead (0.9.8)

Local `main` was behind `origin/main` by 22 commits. Always fast-forward at session start:

```bash
git checkout main && git pull --ff-only origin main
```

Notable upstream additions in 0.9.7–0.9.8:
- WhatsApp channel support (`lib/server/agents/channels.js`)
- New test files: `gateway.test.js`, `alphaclaw-version.test.js`, `gog-skill.test.js`, `watchdog-notify.test.js`
- Patch updated: `openclaw+2026.4.11.patch` → `openclaw+2026.4.14.patch`
- 551 total tests (was 541 on pr-4-macos base)

---

### 4. Parallel Agent Dispatch — Subagents Need Bash Permission

Dispatched two background agents to work in parallel:
- Agent A: read `feature/MacOS-post-install` git history
- Agent B: run tests on `pr-4-macos`

**Both failed** because isolated agent sessions do not inherit the parent session's Bash permission grants. Agents reported needing Bash access and returned without doing any work.

**Lesson:** When dispatching subagents that need to run shell commands (git, npm, etc.), either:
1. Grant Bash permissions globally in settings so they inherit it, OR
2. Do the shell work in the parent session and pass the raw output to the agent prompt

For this project, all debugging/test work should stay in the parent session. Subagents are only useful for read-only file analysis (Read/Grep/Glob) unless Bash is globally permitted.

---

## Feature Branch Commit Log (last 10 days, since 2026-04-06)

| Hash | Commit | Key files |
|------|--------|-----------|
| `c0faa0a` | chore: add platform source and test, merge package-lock.json | `lib/platform.js`, `tests/server/platform.test.js`, `package-lock.json`, `CLAUDE.md`, `docs/xcode-claude-integration.md`, `scripts/` |
| `0259a54` | docs: record Windows launcher and PR lessons | `docs/Lessons.MD` |
| `bbe1766` | docs(plan): add macOS PR implementation plan | `docs/superpowers/plans/` |

---

## pr-4-macos Branch Status (as of 2026-04-16)

| Commit | Description |
|--------|-------------|
| `dd2281f` | fix(test): vitest singleFork for SQLite WAL lock flake ← **new this session** |
| `7cfa041` | fix(macos): start managed scheduler and tighten cron validation |
| `2d3cd2c` | fix(macos): address review feedback — scheduler activation + cron validation |
| `99de3c0` | fix: resolve 3 test failures from merge conflict residue |
| `61c8284` | fix(gateway): harden sanitizeOpenclawConfig against edge cases |
| `4d04616` | fix(gateway): ensure models array on every openclaw.json provider |
| `3d99697` | fix(platform): address code review issues in lib/platform.js + alphaclaw.js wiring |
| `3bbf43d` | fix(macos): extract bin-path resolution into lib/platform.js |
| `ad2325f` | merge: upstream/main (0.9.3) into pr-4-macos + resolve read-only onboarding conflicts |

**Test status:** 83 files, 541 tests — all green (with singleFork fix applied).

---

## Open PRs

| PR | Branch | Status | Description |
|----|--------|--------|-------------|
| diazMelgarejo/AlphaClaw#4 | `pr-4-macos` | Open, awaiting review | macOS port (7 commits) |
| chrysb/alphaclaw#69 | `fix/vitest-singlefork-sqlite-flake` | **New — Open** | Fix flaky SQLite test timeout |

---

## Session Checklist for Next Agent/Human

- [ ] Merge `fix/vitest-singlefork-sqlite-flake` once chrysb/alphaclaw#69 is reviewed/merged
- [ ] After upstream merges #69, rebase `pr-4-macos` on updated main (to avoid duplicate commit)
- [ ] Remaining macOS work (E.1–E.5 in CLAUDE.md): esbuild arm64, LaunchAgent plist, npm global prefix advisory, CI matrix
- [ ] Sync local `main` from upstream chrysb at next session start: `git fetch upstream main && git merge --ff-only upstream/main`
- [ ] Consider whether `pr-4-macos` needs rebasing onto 0.9.8 before upstream review
