---
name: alphaclaw-conventions
description: Development conventions and patterns for AlphaClaw. JavaScript Express project with conventional commits, platform support, and upstream merge workflows.
---

# AlphaClaw Development Patterns

> Synthesized from integration-base ECC artifacts and [PR #30](https://github.com/diazMelgarejo/AlphaClaw/pull/30) (ECC Tools repo analysis, 2026-08-06). Preserves fork-specific operational workflows alongside auto-detected conventions.

## Overview

This skill teaches Claude the development patterns and conventions used in AlphaClaw—a JavaScript Express project that wraps OpenClaw with setup UI, gateway lifecycle, watchdog recovery, and cross-platform support (Linux, macOS, Windows).

AlphaClaw emphasizes clear commit practices, robust testing (Vitest + Supertest), platform-specific support, upstream merge discipline, and a strong documentation culture (`AGENTS.md`, `docs/Lessons.MD`, `docs/wiki/`).

## Tech Stack

- **Primary Language**: JavaScript (Node.js 22.14+)
- **Framework**: Express 4 (setup API layer; do not assume Express 5 semantics)
- **Frontend**: Preact + `htm`, esbuild bundle under `lib/public/dist/`
- **Architecture**: Hybrid module organization (`bin/`, `lib/server/`, `lib/public/`, `lib/setup/`)
- **Test Location**: `tests/server/`, `tests/frontend/`
- **Test Framework**: Vitest + Supertest

## When to Use This Skill

Activate this skill when:

- Making changes to this repository
- Adding new features following established patterns
- Merging upstream OpenClaw or resolving fork conflicts
- Adding or fixing platform-specific logic (macOS, Linux, Windows)
- Writing tests that match project conventions
- Creating commits with proper message format
- Updating CI matrix or documentation after significant changes

## Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/) with these prefixes: `docs`, `fix`, `chore`, `feat`, `merge`, `test`.

### Message Guidelines

- Average message length: ~62 characters
- Keep first line concise and descriptive
- Use imperative mood ("Add feature" not "Added feature")

### Examples

```text
Setup: support read-only OpenClaw onboarding
```

```text
merge: upstream/main (0.9.3) into pr-4-macos + resolve read-only onboarding conflicts
```

```text
fix(macos): extract bin-path resolution into lib/platform.js
```

```text
test(system-cron): assert /etc/cron.d write on linux install
```

```text
docs: add macOS post-install lessons learned
```

```text
fix(platform): address code review issues in lib/platform.js + alphaclaw.js wiring
```

## Architecture

### Project Structure

| Area | Path | Role |
|------|------|------|
| CLI entry | `bin/alphaclaw.js` | Lifecycle commands |
| Server | `lib/server/` | Express APIs, watchdog, channel integrations, gateway proxy |
| Setup UI | `lib/public/` | Preact components; rebuild with `npm run build:ui` after source changes |
| Setup prompts | `lib/setup/` | Agent/system prompt hardening templates |
| Platform | `lib/platform.js` | OS detection and platform-specific paths |
| Tests | `tests/server/`, `tests/frontend/` | Vitest suites |

### Configuration Files

- `.github/workflows/ci.yml`
- `package.json` / `package-lock.json` (or pnpm lockfile when migrated)

### Guidelines

- Follow existing patterns when adding new code
- Use `readOpenclawConfig` from `lib/server/openclaw-config.js` for config reads
- Prefer `cachedFetch` / `useCachedFetch` for setup UI backend reads
- Decompose growing files into focused modules (routes, hooks, components)

## Code Style

### Naming Conventions

| Element | Convention |
|---------|------------|
| Files | kebab-case |
| Functions | camelCase |
| Classes | PascalCase |
| Constants | SCREAMING_SNAKE_CASE |

### Import Style: Relative Imports

```js
import { startServer } from '../server/start-server.js';
```

### Export Style: Named Exports

```js
export function detectPlatform() { ... }
export const SUPPORTED_PLATFORMS = ['linux', 'darwin'];
```

## Testing

### Test Framework: Vitest

### File Pattern: `*.test.js`

- **Unit tests**: Individual functions and components in isolation
- **Integration tests**: Route handlers, subprocess lifecycles, cross-module flows
- Place server-side tests in `tests/server/` and frontend tests in `tests/frontend/`
- Use `pytestmark = pytest.mark.integration` pattern equivalent: `// @vitest-environment node` where needed
- Run `npm install` before `npm test` in fresh checkouts

### Example

```js
import { detectPlatform } from '../../lib/platform.js';
import { describe, it, expect } from 'vitest';

describe('detectPlatform', () => {
  it('should return a supported platform', () => {
    expect(['linux', 'darwin', 'win32']).toContain(detectPlatform());
  });
});
```

### Coverage

Aim for meaningful behavioral coverage on routes, watchdog flows, and setup state. Document coverage gates in skill cards when applicable.

## Error Handling

```js
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error('User-friendly message');
}
```

## AlphaClaw Operational Workflows

Fork-specific workflows detected from integration history. Use these alongside generic feature/TDD/refactor patterns below.

### Feature Development with Tests and Docs

**Trigger:** New capability, platform support, or major fix  
**Command:** `/feature`

1. Modify or add implementation files (`bin/alphaclaw.js`, `lib/server/`, `lib/platform.js`).
2. Update or add corresponding test files (`tests/server/`, `tests/frontend/`).
3. Update documentation (`README.md`, `AGENTS.md`, `docs/Lessons.MD`, `docs/wiki/`).

### Merge Upstream and Resolve Conflicts

**Trigger:** Upstream changes need integration into a long-lived PR or feature branch  
**Command:** `/merge-upstream`

1. Merge `upstream/main` or release branch into your working branch.
2. Resolve merge conflicts, preserving custom logic or guards.
3. Update lockfiles and affected manifests.
4. Run and fix tests as needed.

```sh
git fetch upstream
git merge upstream/main
# Resolve conflicts in files like bin/alphaclaw.js
npm install
npm test
```

### Platform-Specific Support and Testing

**Trigger:** New OS support or platform-specific bugfix  
**Command:** `/platform-support`

1. Add or update platform detection and logic (`lib/platform.js`, `bin/alphaclaw.js`).
2. Update platform-specific scripts/templates (e.g. `lib/scripts/macos-hourly-sync.plist.template`).
3. Add or update platform tests (`tests/server/platform.test.js`).
4. Update documentation with platform-specific notes.

### Test Failure Triage and Fix

**Trigger:** Tests fail after merge, refactor, or platform update  
**Command:** `/fix-tests`

1. Identify failing or flaky tests.
2. Diagnose root cause (merge residue, environment changes, resource leaks).
3. Update test files and implementation as needed.
4. Record lessons in `docs/Lessons.MD` when non-obvious.

### Documentation Knowledge System Update

**Trigger:** New lessons, workflows, or post-merge fixes  
**Command:** `/add-lesson`

1. Add or update `docs/Lessons.MD` with session logs or lessons.
2. Add or update `docs/wiki/*.md` with detailed articles.
3. Update `SKILL.md` or `AGENTS.md` to reference new knowledge.
4. Link lessons across files for discoverability.

### CI Config and Cross-Platform Test Matrix Update

**Trigger:** New platform support or improved CI coverage  
**Command:** `/ci-update`

1. Update `.github/workflows/ci.yml` with new OS matrix entries or test steps.
2. Update scripts/tests to support new CI paths.
3. Update `package.json` / lockfile if platform-specific dependencies change.

## Common Workflows (Auto-Detected)

Patterns from commit history analysis (ECC Tools). Complement the operational workflows above.

### Feature Development

**Frequency**: ~16 times per month

**Steps**: Add implementation → add tests → update documentation

**Files typically involved**: `lib/public/js/components/*`, `lib/server/*`, `**/*.test.*`

### Test Driven Development

**Frequency**: ~3 times per month

**Steps**: Write failing test → implement → refactor

### Refactoring

**Frequency**: ~5 times per month

**Steps**: Ensure tests pass → refactor structure → verify tests still pass

## Commands

| Command | Purpose |
|---------|---------|
| `/feature` | Start feature development with tests and documentation |
| `/merge-upstream` | Merge upstream changes and resolve conflicts |
| `/platform-support` | Add or fix platform-specific logic and tests |
| `/fix-tests` | Diagnose and fix failing or flaky tests |
| `/add-lesson` | Add or update documentation, lessons, or wiki pages |
| `/ci-update` | Update CI configuration or test matrix |

## Best Practices

### Do

- Use conventional commit format (`feat:`, `fix:`, etc.)
- Write tests using Vitest; follow `*.test.js` naming
- Use kebab-case for file names; prefer named exports
- Run `npm run build:ui` after setup UI source changes
- Use integrative merge discipline on fork PRs (synthesize, never amputate)

### Don't

- Don't write vague commit messages
- Don't skip tests for new features
- Don't deviate from established patterns without discussion
- Don't hand-edit `~/.openclaw/` or thin Hermes stub bodies when installer owns them

---

*Synthesized by harmonizing integration-base ECC artifacts with [ECC Tools PR #30](https://github.com/diazMelgarejo/AlphaClaw/pull/30). Review and extend additively.*
