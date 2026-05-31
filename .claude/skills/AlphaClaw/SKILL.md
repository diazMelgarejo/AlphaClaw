```markdown
# AlphaClaw Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the AlphaClaw repository, a JavaScript backend project built with the Express framework. You'll learn how to structure files, write and organize code, and implement tests using the project's established standards.

## Coding Conventions

### File Naming
- Use **kebab-case** for all file names.
  - Example:  
    ```
    user-controller.js
    auth-service.js
    index.js
    ```

### Import Style
- Always use **relative imports**.
  - Example:
    ```js
    import { getUser } from './user-service.js';
    import { logger } from '../utils/logger.js';
    ```

### Export Style
- Use **named exports** exclusively.
  - Example:
    ```js
    // user-service.js
    export function getUser(id) { ... }
    export function createUser(data) { ... }
    ```

### Commit Patterns
- Commit messages are freeform, often prefixed with `recovery`, and average 105 characters.
  - Example:
    ```
    recovery: fixed session restoration after server restart by updating token validation logic
    ```

## Workflows

### [No Automated Workflows Detected]
There are currently no automated workflows (such as CI/CD or deployment scripts) detected in this repository.

## Testing Patterns

- **Framework:** [Vitest](https://vitest.dev/)
- **Test File Pattern:** All test files use the `*.test.js` naming convention.
  - Example:
    ```
    user-controller.test.js
    auth-service.test.js
    ```
- **Test Example:**
    ```js
    // user-controller.test.js
    import { describe, it, expect } from 'vitest';
    import { getUser } from './user-controller.js';

    describe('getUser', () => {
      it('returns user data for valid ID', () => {
        const user = getUser(1);
        expect(user).toBeDefined();
      });
    });
    ```

## Commands

| Command        | Purpose                                      |
|----------------|----------------------------------------------|
| /test          | Run all tests with Vitest                    |
| /lint          | (If applicable) Lint codebase for style      |
| /commit-guide  | Show commit message conventions              |
| /conventions   | Show coding conventions summary              |
```
