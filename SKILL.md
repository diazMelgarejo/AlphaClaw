# AlphaClaw Agent Skills

> **For agents:** This file is your behavioral ruleset for this repo. Read it before making any change. Rules here are derived from real bugs — every "never" has a story behind it.
>
> Full context for each rule lives in [docs/wiki/](docs/wiki/README.md).

---

## Skill 1 — Prevent Duplicate Files

**Trigger:** Before any file operation (rename, copy, move). Also run at session start.

### Rule

**Never use Finder or any GUI tool to move, copy, or rename tracked files.**

macOS Finder creates `file 2.js`, `file 3.js` when a filename collision occurs ("keep both"). These silently enter git as untracked files. The canonical file may not exist at all — only the numbered copies.

### Required: Session-Start Dupe Check

Run this before touching any code:

```bash
find . -name "* 2.*" -o -name "* 3.*" | grep -v node_modules | grep -v .git
```

**Expected output: empty.** Any result means a file needs triage before you proceed.

### Triage Decision Tree

```
numbered copy exists?
├── canonical also exists?
│   ├── files identical? → delete numbered copy
│   └── files differ? → merge content into canonical, delete numbered copy
└── canonical does NOT exist? → rename numbered copy to canonical name
```

### Correct Commands

```bash
# Rename a file (tracked by git)
git mv "lib/platform 2.js" lib/platform.js

# Copy + remove original
cp src.js dest.js && git rm src.js

# Delete duplicate
git rm "lib/platform 2.js"
```

→ Full lesson: [docs/wiki/07-duplicate-files.md](docs/wiki/07-duplicate-files.md)

---

## Skill 2 — macOS Path Rules

**Never write to `/usr/local/bin`, `/etc/cron.d`, or any root-owned path on darwin.**

Use `getBinPath()` from `lib/platform.js` for bin dirs. Use the in-process managed scheduler (not cron.d) for scheduled tasks on macOS.

→ [docs/wiki/02-macos-bin-path.md](docs/wiki/02-macos-bin-path.md) · [docs/wiki/04-cron-scheduler.md](docs/wiki/04-cron-scheduler.md)

---

## Skill 3 — Gateway Config

**Always call `sanitizeOpenclawConfig()` before spawning the gateway.** Raw `openclaw.json` from disk may have providers without `models: []`, causing a silent 30-second startup timeout.

→ [docs/wiki/03-gateway-config.md](docs/wiki/03-gateway-config.md)

---

## Skill 4 — Read-Only Guard Invariant

**`ensureManagedExecDefaults` and all config-mutating calls must stay inside `if (!validatedReadOnlyMode)` in `lib/server/onboarding/index.js`.** This is a security boundary — never move calls outside it.

After any merge conflict resolution touching `onboarding/index.js`:

```bash
npx vitest run tests/server/routes-onboarding.test.js tests/server/routes-system.test.js
```

→ [docs/wiki/05-merge-conflicts.md](docs/wiki/05-merge-conflicts.md)

---

## Skill 5 — Cron Validation

**Reject named cron tokens** (`MON`, `SUN`, `JAN`, etc.) at the API boundary. The managed scheduler parser calls `parseInt()` per field — named tokens become `NaN` and the sync silently never runs.

Validation: `return parts.every((part) => /^[\d,*/\-]+$/.test(part));`

→ [docs/wiki/04-cron-scheduler.md](docs/wiki/04-cron-scheduler.md)

---

## Skill 6 — vitest Config

**`singleFork: true` must remain in `vitest.config.js`.** Multiple test files open `DatabaseSync` (node:sqlite) connections. Parallel workers race on WAL locks → 60s+ test timeouts. The singleFork setting prevents this.

→ [docs/wiki/06-vitest-sqlite-flake.md](docs/wiki/06-vitest-sqlite-flake.md)

---

## Skill 7 — Subagent Shell Work

**Do not dispatch subagents to run `git`, `npm`, or any shell commands.** Subagents do not inherit parent-session Bash permission grants. Keep all shell work in the parent session. Subagents are useful for read-only file analysis (Read, Grep, Glob) only.

→ [docs/wiki/08-subagent-bash-permissions.md](docs/wiki/08-subagent-bash-permissions.md)

---

## Skill 8 — Branch Discipline

**Work on `pr-4-macos`.** Save lessons to `feature/MacOS-post-install`. Never commit to `main`. Never add version bumps or docs to `pr-4-macos`.

→ [docs/wiki/01-branch-roles.md](docs/wiki/01-branch-roles.md)

---

## Skill 9 — Test Flakiness: Diagnose Before Fixing

When a test suite has flaky tests:

1. Identify the failure category (timing race, state leak, resource contention, environment difference)
2. Verify your proposed fix targets the actual cause — not a symptom
3. Check if the framework version supports your proposed config change
4. Search upstream issues/PRs before implementing

**Never:** Add vitest `singleFork` or single-worker config to mask resource leaks.
**Instead:** Close DatabaseSync handles in afterEach; export `close()` from singleton DB modules.

→ [docs/wiki/10-root-cause-debugging.md](docs/wiki/10-root-cause-debugging.md)

---

## Quick Reference: Session Commands

```bash
# Start of session
find . -name "* 2.*" -o -name "* 3.*" | grep -v node_modules | grep -v .git  # dupe check
git checkout main && git pull --ff-only origin main
git checkout pr-4-macos && git merge --ff-only main
npm test   # must be green before new work

# After new work
npx vitest run tests/server/routes-onboarding.test.js   # after any onboarding change
npm test                                                  # full suite before push
```

→ Full checklist: [docs/wiki/09-session-checklist.md](docs/wiki/09-session-checklist.md)

---

## Knowledge Wiki

All lessons, root-cause analyses, and architectural decisions:
**[docs/wiki/README.md](docs/wiki/README.md)**

Session logs:
- [2026-04-16](docs/superpowers/plans/2026-04-16-session-lessons.md) — dupe cleanup, vitest WAL fix, upstream 0.9.8 sync
- [2026-04-13](docs/superpowers/plans/2026-04-13-alphaclaw-macos-pr.md) — macOS PR implementation plan
