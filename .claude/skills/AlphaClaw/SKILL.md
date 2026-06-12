```markdown
# AlphaClaw Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the AlphaClaw repository, a TypeScript backend project built with the Express framework. You'll learn how to structure files, write imports/exports, and follow commit and testing conventions to ensure consistency and maintainability in your contributions.

## Coding Conventions

### File Naming
- Use **kebab-case** for all file names.

  **Example:**
  ```
  user-controller.ts
  order-service.ts
  ```

### Import Style
- Use **relative imports** for referencing local modules.

  **Example:**
  ```typescript
  import { getUser } from './user-service';
  import { Order } from '../models/order';
  ```

### Export Style
- Use **named exports** for all modules.

  **Example:**
  ```typescript
  // user-service.ts
  export function getUser(id: string) { ... }
  export function createUser(data: UserData) { ... }
  ```

  ```typescript
  // Importing named exports
  import { getUser, createUser } from './user-service';
  ```

### Commit Patterns
- Commit messages are **freeform** (no strict type or prefix required).
- Average commit message length: **62 characters**.
- Prefixes are sometimes used but not enforced.

  **Example:**
  ```
  Add endpoint for updating user profile information
  ```

## Workflows

*(No automated workflows detected in this repository.)*

## Testing Patterns

- **Test file naming:** Use `*.test.*` pattern for test files.

  **Example:**
  ```
  user-controller.test.ts
  order-service.test.ts
  ```

- **Testing framework:** Not explicitly detected. (Check project dependencies or ask the maintainer.)

- **Test location:** Test files are typically placed alongside the files they test or in a dedicated `tests` directory.

  **Example Test File:**
  ```typescript
  // user-controller.test.ts
  import { getUser } from './user-controller';

  describe('getUser', () => {
    it('should return user data for valid ID', () => {
      // test implementation
    });
  });
  ```

## Commands
| Command | Purpose |
|---------|---------|
| /test   | Run all tests in the repository |
| /lint   | Check code for style and formatting issues |
| /build  | Build the TypeScript project |
```