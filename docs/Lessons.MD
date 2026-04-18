# Lessons

## Windows Development

- Use user-owned shims in `C:\Users\lab\.lmstudio\bin` instead of versioned symlinks into app install folders.
- Anchor `node` to LM Studio's bundled runtime at `C:\Users\lab\.lmstudio\.internal\utils\node.exe` and let `npm.cmd` resolve the latest compatible npm package from `C:\Users\lab\.lmstudio\tools\npm`.
- Resolve `git.exe` dynamically from GitHub Desktop so app updates do not break the shell setup.
- Verify the wiring directly with `git --version`, `node --version`, and `npm --version`.

## AlphaClaw PR Decisions

- Start the managed scheduler immediately after macOS onboarding installs the hourly sync config.
- Reject named cron tokens in the managed scheduler path because the parser only handles numeric cron fields reliably.
- Add targeted regression tests beside the affected onboarding and system routes.
- Keep process notes in a separate docs branch so the code-fix branch stays easy to review and merge.

## macOS Duplicate File Hazard

- macOS Finder creates numbered copies (`file 2.js`, `file 3.js`) when files are duplicated or "keep both" is selected.
- These can silently enter git as new files — check with `find . -name "* 2.*" -o -name "* 3.*" | grep -v node_modules | grep -v .git` periodically.
- Always use `git mv` or terminal `cp` + `git rm` — never Finder for tracked files.

## Vitest + node:sqlite WAL Lock Flake

- When multiple vitest workers open `DatabaseSync` connections to the same WAL-mode SQLite file concurrently, `PRAGMA busy_timeout` retries compound into multi-minute hangs.
- Fix: `pool: "forks"` + `poolOptions.forks.singleFork: true` in `vitest.config.js` serializes test files into one process. Suite time dropped from 64s to 7s.
- Submitted upstream as chrysb/alphaclaw#69.

## Subagent Bash Permissions

- Background agents dispatched via the Agent tool do NOT inherit the parent session's Bash permission grants.
- Agents that need `git`, `npm`, or shell commands will fail silently unless Bash is globally permitted in settings.
- For this project: keep all shell/debug work in the parent session. Use subagents only for read-only file analysis.
