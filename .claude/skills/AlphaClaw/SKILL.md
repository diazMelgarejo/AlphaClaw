---
name: alphaclaw-conventions
description: Development conventions and patterns for AlphaClaw. JavaScript Express project with conventional commits, platform support, and upstream merge workflows.
---

# AlphaClaw Development Patterns

> Synthesized from integration-base ECC artifacts and [PR #30](https://github.com/diazMelgarejo/AlphaClaw/pull/30) (ECC Tools repo analysis, 2026-08-06). Preserves fork-specific operational workflows alongside auto-detected conventions. Merged rather than replaced; each version had content and examples the other lacked. See the synthesis note at the end for lineage and merge guidance.

## Overview

This skill teaches Claude the development patterns and conventions used in AlphaClaw — a JavaScript Express project that wraps OpenClaw with setup UI, gateway lifecycle, watchdog recovery, and cross-platform support (Linux, macOS, Windows). AlphaClaw emphasizes clear commit practices, robust testing (Vitest + Supertest), platform-specific support, upstream merge discipline, and a strong documentation culture (`CLAUDE.md`, `AGENTS.md`, `docs/Lessons.MD`, `docs/wiki/`). This guide helps you contribute effectively by following established conventions and workflows, ensuring code quality and maintainability.

## Tech Stack

- **Primary Language**: JavaScript (Node.js 22.22.3+; or supported Node 24.15+/25.9+ per `package.json` engines)
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
- Merging or regenerating ECC bundle artifacts (`.claude/`, `.agents/skills/AlphaClaw/`)

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
| ECC bundle | `.claude/`, `.agents/skills/AlphaClaw/` | Agent conventions, instincts, manifest (`ecc-tools.json`) |

### Configuration Files

- `.github/workflows/ci.yml`
- `package.json` / `package-lock.json` (or pnpm lockfile when migrated)
- `.claude/ecc-tools.json` (ECC manifest; guarded by `scripts/check-ecc-manifest.sh`)

### Guidelines

- Follow existing patterns when adding new code
- Use `readOpenclawConfig` from `lib/server/openclaw-config.js` for config reads
- Prefer `cachedFetch` / `useCachedFetch` for setup UI backend reads
- Decompose growing files into focused modules (routes, hooks, components)
- After upstream merges, run `bash scripts/check-ecc-manifest.sh` — ECC paths are frequently dropped during integration

## Code Style

### Naming Conventions

| Element | Convention |
|---------|------------|
| Files | kebab-case |
| Functions | camelCase |
| Classes | PascalCase |
| Constants | SCREAMING_SNAKE_CASE |

Examples: `server-utils.js`, `platform-support.js`, `user-controller.js` (v0 ECC proto).

### Import Style: Relative Imports

```js
import { startServer } from '../server/start-server.js';
```

### Export Style: Named Exports

```js
// lib/platform.js
export function detectPlatform() { ... }
export const SUPPORTED_PLATFORMS = ['linux', 'darwin'];
```

## Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/) with these prefixes: `docs`, `fix`, `chore`, `feat`, `merge`, `test`.

### Message Guidelines

- Average message length: ~62 characters (fork integration commits may be longer)
- Keep first line concise and descriptive
- Use imperative mood ("Add feature" not "Added feature")
- **Recovery commits** (v0 ECC proto): session salvage work may use a `recovery:` prefix with a descriptive body when appropriate

### Examples

```text
feat(server): add onboarding route for new users
```

```text
Setup: support read-only OpenClaw onboarding
```

```text
merge: upstream/main (0.9.3) into pr-4-macos + resolve read-only onboarding conflicts
```

```text
Merge main into pr-4-macos and resolve read-only onboarding conflicts.
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

```text
Add macOS support
```

## Testing

- **Framework**: [Vitest](https://vitest.dev/)
- **File pattern**: `*.test.js`
- Place server-side tests in `tests/server/` and frontend tests in `tests/frontend/`
- **Unit tests**: individual functions and components in isolation
- **Integration tests**: route handlers, subprocess lifecycles, cross-module flows
- Run `npm install` before `npm test` in fresh checkouts
- For subprocess or Node-environment integration tests, use `// @vitest-environment node` when needed (never pytest patterns — this is a JavaScript repo)
- When a test's name claims to cover a specific platform (e.g. "returns darwin on macOS"), mock `process.platform` accordingly rather than asserting a fact the test doesn't actually exercise

### Examples

```js
// tests/server/platform.test.js
import { detectPlatform } from '../../lib/platform.js';
import { describe, it, expect } from 'vitest';

describe('detectPlatform', () => {
  it('should return a supported platform', () => {
    expect(['linux', 'darwin', 'win32']).toContain(detectPlatform());
  });
});
```

```js
// tests/server/new-feature.test.js
import { newFeature } from '../../lib/server/new-feature.js';
import { describe, it, expect } from 'vitest';

describe('newFeature', () => {
  it('should work as expected', () => {
    expect(newFeature()).toBeTruthy();
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

## Workflows

Fork-specific operational workflows from integration history (v1.1 `16bea5e`). Use alongside auto-detected patterns in **Common Workflows** below.

### Feature Development with Tests and Docs

**Trigger:** New capability, platform support, or major fix
**Command:** `/feature`

1. Modify or add implementation files (`bin/alphaclaw.js`, `lib/server/`, `lib/platform.js`).
2. Update or add corresponding test files (`tests/server/`, `tests/frontend/`).
3. Update documentation (`README.md`, `AGENTS.md`, `docs/Lessons.MD`, `docs/wiki/`).

**Example:**

```js
// lib/server/new-feature.js
export function newFeature() { ... }
```

```js
// tests/server/new-feature.test.js
import { newFeature } from '../../lib/server/new-feature.js';
import { describe, it, expect } from 'vitest';

describe('newFeature', () => {
  it('should work as expected', () => {
    expect(newFeature()).toBeTruthy();
  });
});
```

### Merge Upstream and Resolve Conflicts

**Trigger:** Upstream changes need integration into a long-lived PR or feature branch
**Command:** `/merge-upstream`

1. Merge `upstream/main` or release branch into your working branch.
2. Resolve merge conflicts, preserving custom logic or guards.
3. Update lockfiles and affected manifests (including ECC bundle if present).
4. Run `bash scripts/check-ecc-manifest.sh` and `npm test`.

```sh
git fetch upstream
git merge upstream/main
# Resolve conflicts in files like bin/alphaclaw.js
npm install
bash scripts/check-ecc-manifest.sh
npm test
```

### Platform-Specific Support and Testing

**Trigger:** New OS support or platform-specific bugfix
**Command:** `/platform-support`

1. Add or update platform detection and logic (`lib/platform.js`, `bin/alphaclaw.js`).
2. Update platform-specific scripts/templates (e.g. `lib/scripts/macos-hourly-sync.plist.template`).
3. Add or update platform tests (`tests/server/platform.test.js`).
4. Update documentation with platform-specific notes.

**Example:**

```js
// lib/platform.js
export function isMacOS() {
  return process.platform === 'darwin';
}
```

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
3. Update `SKILL.md` and the project's agent-instructions files — this repo uses `AGENTS.md` **and** `CLAUDE.md`; update both for Codex and Claude harnesses.
4. Link lessons across files for discoverability.

### CI Config and Cross-Platform Test Matrix Update

**Trigger:** New platform support or improved CI coverage
**Command:** `/ci-update`

1. Update `.github/workflows/ci.yml` with new OS matrix entries or test steps.
2. Update scripts/tests to support new CI paths (include `scripts/check-ecc-manifest.sh` for ECC regressions).
3. Update `package.json` / lockfile if platform-specific dependencies change.

## Common Workflows (Auto-Detected)

Patterns from commit history analysis (ECC Tools, 100 commits). Complement the operational workflows above.

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
- Run `bash scripts/check-ecc-manifest.sh` after merges that touch `.claude/` or `.agents/`

### Don't

- Don't write vague commit messages
- Don't skip tests for new features
- Don't deviate from established patterns without discussion
- Don't hand-edit `~/.openclaw/` or thin Hermes stub bodies when installer owns them
- Don't let upstream merges silently drop ECC bundle files — restore additively from lineage

---

## Synthesis note

This file merges multiple ECC generations rather than letting any single version replace the others (orama CIDF integrative merge).

### Lineage

| Version | Commit | Instincts | SKILL | Notes |
|---------|--------|----------:|------:|-------|
| v0 proto | `d038eb8` | 21 | 80L | First ECC bundle (PR #3); recovery commit pattern |
| v0b regen | `b34bf6d` | 13 | 90L | **Regression** — lost 10 v0 instincts |
| v1.1 | `16bea5e` | 36 | 166L | Full fork workflows + commands (PR #15) |
| v1.1+sec | `16392c8` | 36 | 166L | security-evidence in manifest |
| v2 harmonize | `eb10e75` | 12 | 290L | **Rejected** — dropped 24 instincts, prose-only workflows |
| v3 synthesize | `94f8a90` | 36 | 287L | Restored instincts; PR #30 structure |
| **Final** | this file | **45** | — | v3 + v0/v0b union + textual resynthesis |

### What each layer contributed

- **From v0 (`d038eb8`)**: recovery commit pattern, secondary file-naming examples, Vitest test-file examples
- **From v1.1 (`16bea5e`)**: all six fork operational workflows with inline code examples (`new-feature`, `isMacOS`, merge shell)
- **From v2 (`eb10e75`)**: YAML frontmatter, architecture tables, Common Workflows frequency data, extra commit examples (`Add macOS support`, long merge message) — **instinct drops rejected**
- **From v3 (`94f8a90`)**: Tech Stack detail, Express 4 guardrail, integrative merge best practice, error-handling block
- **From textual resynthesis (uploaded draft)**: section ordering (Architecture before Commit), CLAUDE.md in doc list, platform-test mocking guidance, expanded synthesis criticism, removal of pytest stray and code-fence wrapper

### Fixed, not preserved

- v2/v3 `pytestmark` Python reference → replaced with Vitest `// @vitest-environment node`
- v1.1 stray ` ```markdown ` wrapper around entire SKILL
- v2 replacement of workflow code examples with prose-only steps
