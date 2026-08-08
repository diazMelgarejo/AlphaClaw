# Workflows and commands

Fork-specific operational workflows from integration history (v1.1 `16bea5e`). Complement auto-detected patterns in **Common workflows** below.

## Command index

| Command | Purpose |
|---------|---------|
| `/feature` | Feature development with tests and documentation |
| `/merge-upstream` | Merge upstream changes and resolve conflicts |
| `/platform-support` | Add or fix platform-specific logic and tests |
| `/fix-tests` | Diagnose and fix failing or flaky tests |
| `/add-lesson` | Add or update documentation, lessons, or wiki pages |
| `/ci-update` | Update CI configuration or test matrix |

## Feature development (`/feature`)

**Trigger:** New capability, platform support, or major fix.

1. Modify or add implementation (`bin/alphaclaw.js`, `lib/server/`, `lib/platform.js`).
2. Update or add tests (`tests/server/`, `tests/frontend/`).
3. Update docs (`README.md`, `AGENTS.md`, `docs/Lessons.MD`, `docs/wiki/`).

## Merge upstream (`/merge-upstream`)

**Trigger:** Upstream changes need integration into a long-lived PR or feature branch.

1. Merge `upstream/main` or release branch.
2. Resolve conflicts; preserve custom logic or guards.
3. Update lockfiles and manifests (including ECC bundle if present).
4. Run `bash scripts/check-ecc-manifest.sh` and `npm test`.

```sh
git fetch upstream
git merge upstream/main
npm install
bash scripts/check-ecc-manifest.sh
npm test
```

## Platform support (`/platform-support`)

**Trigger:** New OS support or platform-specific bugfix.

1. Update `lib/platform.js`, `bin/alphaclaw.js`.
2. Update platform scripts/templates (e.g. `lib/scripts/macos-hourly-sync.plist.template`).
3. Add or update `tests/server/platform.test.js`.
4. Document platform-specific notes.

## Fix tests (`/fix-tests`)

**Trigger:** Tests fail after merge, refactor, or platform update.

1. Identify failing or flaky tests.
2. Diagnose root cause (merge residue, environment, resource leaks).
3. Update tests and implementation.
4. Record lessons in `docs/Lessons.MD` when non-obvious.

## Add lesson (`/add-lesson`)

**Trigger:** New lessons, workflows, or post-merge fixes.

1. Update `docs/Lessons.MD` and `docs/wiki/*.md`.
2. Update `SKILL.md`, `AGENTS.md`, and `CLAUDE.md` (both Codex and Claude harnesses).
3. Link lessons across files for discoverability.

## CI update (`/ci-update`)

**Trigger:** New platform support or improved CI coverage.

1. Update `.github/workflows/ci.yml` (OS matrix, test steps).
2. Update scripts/tests for new CI paths (`scripts/check-ecc-manifest.sh` for ECC regressions).
3. Update `package.json` / lockfile if platform-specific dependencies change.

## Common workflows (auto-detected)

From commit history analysis (ECC Tools, 100 commits):

| Pattern | Frequency | Steps |
|---------|-----------|-------|
| Feature development | ~16/month | Implementation → tests → documentation |
| Test-driven development | ~3/month | Failing test → implement → refactor |
| Refactoring | ~5/month | Tests pass → refactor → verify tests |

Typical files: `lib/public/js/components/*`, `lib/server/*`, `**/*.test.*`.
