```markdown
# AlphaClaw Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill outlines the core development patterns, coding conventions, and workflows used in the AlphaClaw codebase—a JavaScript project built on Express. AlphaClaw emphasizes clear commit practices, robust testing, platform-specific support, and a strong documentation culture. This guide will help you contribute effectively by following established conventions and workflows, ensuring code quality and maintainability.

## Coding Conventions

**File Naming**
- Use `kebab-case` for all file names.
  - Example: `server-utils.js`, `platform-support.js`

**Import Style**
- Use relative imports for all modules.
  - Example:
    ```js
    import { startServer } from '../server/start-server.js';
    ```

**Export Style**
- Use named exports.
  - Example:
    ```js
    // lib/platform.js
    export function detectPlatform() { ... }
    export const SUPPORTED_PLATFORMS = ['linux', 'darwin'];
    ```

**Commit Messages**
- Follow [Conventional Commits](https://www.conventionalcommits.org/) with these prefixes: `docs`, `fix`, `chore`, `feat`, `merge`, `test`.
- Keep commit messages concise (average ~62 characters).
  - Example: `feat(server): add onboarding route for new users`

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
3. Update `package-lock.json` and other affected files.
4. Run and fix tests as needed.

**Example:**
```sh
git fetch upstream
git merge upstream/main
# Resolve conflicts in files like bin/alphaclaw.js
npm install
npm test
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
3. Update `package.json`/`package-lock.json` if needed for platform-specific dependencies.

---

## Testing Patterns

- Use [vitest](https://vitest.dev/) for all tests.
- Test files follow the pattern: `*.test.js`.
- Place server-side tests in `tests/server/` and frontend tests in `tests/frontend/`.
- Example test file:
  ```js
  // tests/server/platform.test.js
  import { detectPlatform } from '../../lib/platform.js';
  import { describe, it, expect } from 'vitest';

  describe('detectPlatform', () => {
    it('should return "darwin" on macOS', () => {
      // Mock process.platform if needed
      expect(['linux', 'darwin']).toContain(detectPlatform());
    });
  });
  ```

## Commands

| Command         | Purpose                                                        |
|-----------------|----------------------------------------------------------------|
| /feature        | Start feature development with tests and documentation         |
| /merge-upstream | Merge upstream changes and resolve conflicts                   |
| /platform-support | Add or fix platform-specific logic and tests                |
| /fix-tests      | Diagnose and fix failing or flaky tests                        |
| /add-lesson     | Add or update documentation, lessons, or wiki pages            |
| /ci-update      | Update CI configuration or test matrix                         |
```
