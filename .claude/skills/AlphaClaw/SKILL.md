---
name: alphaclaw-conventions
description: Development conventions and patterns for AlphaClaw. JavaScript Express project with conventional commits.
---

# Alphaclaw Conventions

> Generated from [diazMelgarejo/AlphaClaw](https://github.com/diazMelgarejo/AlphaClaw) on 2026-08-20

## Overview

This skill outlines the core development patterns, coding conventions, and workflows used in the
AlphaClaw codebase — a JavaScript project built on Express, emphasizing clear commit practices,
robust testing, platform-specific support, and a strong documentation culture. It teaches Claude
these conventions so contributions stay consistent with what the codebase already does.

## Tech Stack

- **Primary Language**: JavaScript
- **Framework**: Express
- **Architecture**: hybrid module organization (single package)
- **Test Location**: separate (`tests/`)
- **Test Framework**: vitest

## When to Use This Skill

Activate this skill when:
- Making changes to this repository
- Adding new features following established patterns
- Writing tests that match project conventions
- Creating commits with proper message format

## Coding Conventions

**File Naming**

| Element | Convention |
|---------|------------|
| Files | kebab-case |
| Functions | camelCase |
| Classes | PascalCase |
| Constants | SCREAMING_SNAKE_CASE |

- Example: `server-utils.js`, `platform-support.js`

**Import Style: Relative Imports**

```js
// Use relative imports
import { startServer } from '../server/start-server.js';
```

**Export Style: Named Exports**

```js
// lib/platform.js
export function detectPlatform() { ... }
export const SUPPORTED_PLATFORMS = ['linux', 'darwin'];
```

**Commit Messages**

Follow [Conventional Commits](https://www.conventionalcommits.org/) with these prefixes: `docs`,
`fix`, `chore`, `feat`, `merge`, `test`. Keep the first line concise (average ~62 characters across
the repo's committed history) and in imperative mood ("Add feature", not "Added feature").

```text
feat(server): add onboarding route for new users
```

**Configuration files that reflect these conventions:** `.github/workflows/ci.yml`, `package.json`.

## Workflows

### Feature Development with Tests and Docs
**Trigger:** When adding a new capability, platform support, or major fix
**Command:** `/feature`

1. Modify or add implementation files (e.g., `bin/alphaclaw.js`, `lib/server/`, `lib/platform.js`).
2. Update or add corresponding test files (e.g., `tests/server/`, `tests/frontend/`).
3. Update documentation files (e.g., `README.md`, `AGENTS.md`, `docs/Lessons.MD`, `docs/wiki/`).

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

---

### Merge Upstream and Resolve Conflicts
**Trigger:** When upstream changes need to be integrated into a long-lived PR or feature branch
**Command:** `/merge-upstream`

1. Merge `upstream/main` or release branch into your working branch.
2. Resolve merge conflicts, preserving custom logic or guards.
3. Update `pnpm-lock.yaml` and other affected files.
4. Run and fix tests as needed.

**Example:**
```sh
git fetch upstream
git merge upstream/main
# Resolve conflicts in files like bin/alphaclaw.js
pnpm install
pnpm test
```

---

### Platform-Specific Support and Testing
**Trigger:** When adding support for a new OS or fixing platform-specific bugs
**Command:** `/platform-support`

1. Add or update platform detection and logic (e.g., `lib/platform.js`, `bin/alphaclaw.js`).
2. Update or add platform-specific scripts/templates (e.g., `lib/scripts/macos-hourly-sync.plist.template`).
3. Add or update tests for platform-specific code (e.g., `tests/server/platform.test.js`).
4. Update documentation with platform-specific notes.

**Example:**
```js
// lib/platform.js
export function isMacOS() {
  return process.platform === 'darwin';
}
```

---

### Test Failure Triage and Fix
**Trigger:** When tests fail after a merge, refactor, or platform update
**Command:** `/fix-tests`

1. Identify failing/flaky tests.
2. Diagnose root cause (e.g., merge residue, environment changes, resource leaks).
3. Update test files and related implementation files as needed.
4. Update documentation or lessons with root cause and fix details.

---

### Documentation Knowledge System Update
**Trigger:** When new lessons are learned, new workflows established, or after significant merges/fixes
**Command:** `/add-lesson`

1. Add or update `docs/Lessons.MD` with session logs or lessons.
2. Add or update `docs/wiki/*.md` with detailed articles.
3. Update `SKILL.md` or `CLAUDE.md` to reference new knowledge.
4. Link lessons across files for discoverability.

---

### CI Config and Cross-Platform Test Matrix Update
**Trigger:** When adding platform support or improving test coverage in CI
**Command:** `/ci-update`

1. Update `.github/workflows/ci.yml` to add new OS matrix entries or test steps.
2. Update or add scripts/tests to support new CI paths.
3. Update `package.json`/`pnpm-lock.yaml` if needed for platform-specific dependencies.

## Testing

### Test Framework: vitest

### File Pattern: `*.test.js`

### Test Types

- **Unit tests**: Test individual functions and components in isolation
- **Integration tests**: Test interactions between multiple components/services
- **E2e tests**: Test complete user flows through the application

### Coverage

This project has coverage reporting configured. Aim for 80%+ coverage.

*Test file structure*

```js
// tests/server/platform.test.js
import { detectPlatform } from '../../lib/platform.js';
import { describe, it, expect, vi } from 'vitest';

describe('detectPlatform', () => {
  it('should return "darwin" on macOS', () => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin');
    expect(detectPlatform()).toBe('darwin');
  });
});
```

## Error Handling

### Error Handling Style: Try-Catch Blocks

*Standard error handling pattern*

```js
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('User-friendly message', { cause: error })
}
```

## Commands

| Command            | Purpose                                                  |
|---------------------|-----------------------------------------------------------|
| `/feature`          | Start feature development with tests and documentation    |
| `/merge-upstream`   | Merge upstream changes and resolve conflicts               |
| `/platform-support` | Add or fix platform-specific logic and tests               |
| `/fix-tests`        | Diagnose and fix failing or flaky tests                    |
| `/add-lesson`       | Add or update documentation, lessons, or wiki pages         |
| `/ci-update`        | Update CI configuration or test matrix                     |

## Best Practices

Based on analysis of the codebase, follow these practices:

### Do

- Use conventional commit format (feat:, fix:, etc.)
- Write tests using vitest
- Follow *.test.js naming pattern
- Use kebab-case for file names
- Prefer named exports
- Follow the documented Workflows above for their respective triggers

### Don't

- Don't write vague commit messages
- Don't skip tests for new features
- Don't deviate from established patterns without discussion

---

*This skill was auto-generated by [ECC Tools](https://ecc.tools), synthesized additively with prior AlphaClaw-specific workflow documentation. Review and customize as needed for your team.*
