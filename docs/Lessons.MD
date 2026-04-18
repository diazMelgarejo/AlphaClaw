# Lessons

> **This is the chronological log.** For organized, cross-linked lessons see the **[wiki →](wiki/README.md)**
> For agent behavioral rules see **[SKILL.md →](../SKILL.md)**

---

## Session 2026-04-13 — macOS PR Implementation

### Platform / Bin-Path

- Use user-owned shims in `~/.local/bin` on darwin; SIP blocks `/usr/local/bin` for non-root users.
- Wire `getBinPath()` from `lib/platform.js` everywhere — never inline the path logic.
- Verify with `ls ~/.local/bin/gog` after install.
- → [wiki/02-macos-bin-path.md](wiki/02-macos-bin-path.md)

### Gateway Config

- Every provider in `openclaw.json` must have `models: []`. Missing it = silent 30-second gateway timeout.
- `sanitizeOpenclawConfig()` must be called before every gateway spawn.
- → [wiki/03-gateway-config.md](wiki/03-gateway-config.md)

### macOS Cron / Scheduler

- `/etc/cron.d` is root-only on macOS. Use the in-process managed scheduler on darwin.
- Named cron tokens (`MON`, `SUN`) crash the `parseInt`-based parser — numeric-only fields only.
- Start the managed scheduler immediately after macOS onboarding installs the hourly sync config.
- → [wiki/04-cron-scheduler.md](wiki/04-cron-scheduler.md)

### Merge Conflicts

- After any conflict resolution touching `lib/server/onboarding/index.js`, run onboarding tests before pushing.
- `ensureManagedExecDefaults` must stay inside `!validatedReadOnlyMode` — it is a security boundary.
- Duplicate calls from merge residue break tests silently.
- → [wiki/05-merge-conflicts.md](wiki/05-merge-conflicts.md)

### AlphaClaw PR Decisions

- Keep process notes in a separate docs branch so the code-fix branch stays easy to review and merge.
- Add targeted regression tests beside the affected onboarding and system routes.
- → [macos-post-install-lessons.md](macos-post-install-lessons.md)

---

## Session 2026-04-16 — Duplicate Cleanup, Vitest Fix, Upstream 0.9.8

### macOS Duplicate File Hazard

- macOS Finder creates numbered copies (`file 2.js`, `file 3.js`) when files are duplicated or "keep both" is selected.
- These can silently enter git as new files. The canonical file may not exist at all — only the numbered copy.
- **Check command:** `find . -name "* 2.*" -o -name "* 3.*" | grep -v node_modules | grep -v .git`
- Always use `git mv` or terminal commands — never Finder for tracked files.
- → [wiki/07-duplicate-files.md](wiki/07-duplicate-files.md)

### Vitest + node:sqlite WAL Lock Flake

- Parallel vitest workers race on WAL write locks → `busy_timeout` retries compound → 60s+ hang.
- Fix: `pool: "forks"` + `poolOptions.forks.singleFork: true` in `vitest.config.js`. Suite: 64s → 7s.
- Submitted upstream as chrysb/alphaclaw#69.
- → [wiki/06-vitest-sqlite-flake.md](wiki/06-vitest-sqlite-flake.md)

### Subagent Bash Permissions

- Background agents dispatched via the Agent tool do NOT inherit the parent session's Bash permission grants.
- Agents that need `git`, `npm`, or shell commands will fail silently unless Bash is globally permitted in settings.
- For this project: keep all shell/debug work in the parent session. Use subagents only for read-only file analysis.
- → [wiki/08-subagent-bash-permissions.md](wiki/08-subagent-bash-permissions.md)

### Windows Development

- Use user-owned shims in `C:\Users\lab\.lmstudio\bin` instead of versioned symlinks into app install folders.
- Anchor `node` to LM Studio's bundled runtime at `C:\Users\lab\.lmstudio\.internal\utils\node.exe`.
- Resolve `git.exe` dynamically from GitHub Desktop so app updates do not break the shell setup.
- Verify: `git --version`, `node --version`, `npm --version`.

---

## Wiki

All lessons above are expanded with root causes, exact fixes, and verification commands:

| # | Page | Topic |
| --- | --- | --- |
| 01 | [Branch Roles](wiki/01-branch-roles.md) | Which branch, which purpose, data flow |
| 02 | [macOS Bin-Path](wiki/02-macos-bin-path.md) | SIP, `~/.local/bin`, `getBinPath()` |
| 03 | [Gateway Config](wiki/03-gateway-config.md) | `models: []`, `sanitizeOpenclawConfig()` |
| 04 | [Cron / Scheduler](wiki/04-cron-scheduler.md) | LaunchAgent, named token rejection |
| 05 | [Merge Conflicts](wiki/05-merge-conflicts.md) | Read-only guard, onboarding patterns |
| 06 | [Vitest SQLite Flake](wiki/06-vitest-sqlite-flake.md) | WAL locks, singleFork fix |
| 07 | [Duplicate Files](wiki/07-duplicate-files.md) | macOS "keep both", dupe check command |
| 08 | [Subagent Bash](wiki/08-subagent-bash-permissions.md) | Permission inheritance gotcha |
| 09 | [Session Checklist](wiki/09-session-checklist.md) | Full startup/shutdown sequence |
| 10 | [Root Cause Debugging](wiki/10-root-cause-debugging.md) | Mask vs. fix, test flakiness taxonomy, resource management |

---

## Session 2026-04-18: PR #69 — Root Cause vs. Mask

**PR:** <https://github.com/chrysb/alphaclaw/pull/69>
**Rejected commit:** `2f5b3b3` (vitest singleFork)

**What happened:** We correctly diagnosed SQLite WAL-lock contention causing flaky tests.
We proposed `singleFork: true` in vitest.config.js to serialize the suite through one worker.
Upstream rejected: (a) Vitest 4 removed singleFork — our fix was already a no-op, and
(b) the correct fix is explicit `DatabaseSync.close()` in afterEach, not config-level serialization.

**Generalizable patterns (see wiki/10-root-cause-debugging.md):**

1. Diagnose the root cause layer before proposing a fix — we fixed at the config layer when the issue was at the resource layer
2. Verify framework API exists before proposing config changes (`singleFork` was removed in Vitest 4)
3. Check upstream issues/PRs before implementing — they may already have a fix in-flight
4. For DatabaseSync (node:sqlite): always close handles in afterEach; never leave module-level singletons open across tests

**Do not re-propose:** vitest singleFork, poolOptions.forks serialization, or any "force single worker" approach for this codebase.

---

## Session 2026-04-18: Upstream Merge — ENV Refactor Conflict & Test Fixes

**Branches:** merged upstream 0.9.9 into `pr-4-macos`; rebased `feature/MacOS-post-install` docs on top.

### gogcli HOME Compatibility Pattern

Upstream commit `e0f9fa8` changed the env block passed to every subprocess:

- **Before:** `OPENCLAW_HOME: OPENCLAW_DIR` (the `.openclaw/` subdir)
- **After:** `HOME: kRootDir, OPENCLAW_HOME: kRootDir, OPENCLAW_STATE_DIR: OPENCLAW_DIR`

**Why it changes:** gogcli tools now respect `HOME` for XDG paths; `OPENCLAW_HOME` shifted to the user root and a new `OPENCLAW_STATE_DIR` carries the old managed-dir value.

**Lesson:** When upstream adds a `HOME` override to subprocess env blocks, **two things break at once:** (1) any test asserting `OPENCLAW_HOME: OPENCLAW_DIR`, and (2) any test asserting `OPENCLAW_HOME: "/tmp/openclaw"` (the test-scoped override). Both must migrate to `OPENCLAW_STATE_DIR`.

**Fix pattern:**

```js
// Old assertion (breaks after HOME refactor)
expect(spawnCall[2]).toMatchObject({ env: { OPENCLAW_HOME: OPENCLAW_DIR } });

// New assertion (correct after refactor)
expect(spawnCall[2]).toMatchObject({
  env: expect.objectContaining({
    HOME: expect.any(String),
    OPENCLAW_HOME: expect.any(String),
    OPENCLAW_STATE_DIR: OPENCLAW_DIR,
  }),
});
```

→ [wiki/05-merge-conflicts.md](wiki/05-merge-conflicts.md) Pattern 4

### Import Updates After Conflict Resolution

When a conflict resolution adds a new constant (`kRootDir`) to an env block, **check the require/import at the top of the same file.** Git auto-merge preserves the old import list; the new constant silently resolves as `undefined` at runtime.

**Check after any conflict resolution:**

```bash
grep "kRootDir" lib/server/gateway.js lib/server/onboarding/index.js
# Verify kRootDir appears in both the require() line AND the env block
```

### Rebase Over Upstream Merge Commits

When rebasing a docs branch over a branch that gained a merge commit (e.g., upstream 0.9.9 absorbed into pr-4-macos), use `--autostash`:

```bash
git rebase --autostash pr-4-macos
```

Plain `git rebase` may fail with "your local changes would be overwritten" if the rebase machinery leaves transient state that overlaps with commits being applied.
