---
name: alphaclaw-conventions
description: Development conventions and patterns for AlphaClaw. JavaScript Express project with conventional commits.
---

# Alphaclaw Conventions

> Generated from [diazMelgarejo/AlphaClaw](https://github.com/diazMelgarejo/AlphaClaw) on 2026-08-06

## Overview

This skill teaches Claude the development patterns and conventions used in AlphaClaw.

## Tech Stack

- **Primary Language**: JavaScript
- **Framework**: Express
- **Architecture**: hybrid module organization
- **Test Location**: separate
- **Test Framework**: vitest

## When to Use This Skill

Activate this skill when:
- Making changes to this repository
- Adding new features following established patterns
- Writing tests that match project conventions
- Creating commits with proper message format

## Commit Conventions

Follow these commit message conventions based on 100 analyzed commits.

### Commit Style: Conventional Commits

### Prefixes Used

- `docs`
- `fix`
- `chore`
- `feat`
- `merge`
- `test`

### Message Guidelines

- Average message length: ~62 characters
- Keep first line concise and descriptive
- Use imperative mood ("Add feature" not "Added feature")


*Commit message example*

```text
fix(macos): extract bin-path resolution into lib/platform.js
```

*Commit message example*

```text
test(system-cron): assert /etc/cron.d write on linux install
```

*Commit message example*

```text
docs: add macOS post-install lessons learned
```

*Commit message example*

```text
merge: upstream/main (0.9.3) into pr-4-macos + resolve read-only onboarding conflicts
```

*Commit message example*

```text
fix(platform): address code review issues in lib/platform.js + alphaclaw.js wiring
```

*Historical commit examples (predating strict conventional commit enforcement)*

```text
Setup: support read-only OpenClaw onboarding
```

```text
Add macOS support
```

```text
Merge main into pr-4-macos and resolve read-only onboarding conflicts.
```

## Architecture

### Project Structure: Monorepo

This project uses **hybrid** module organization.

### Configuration Files

- `.github/workflows/ci.yml`
- `package.json`

### Guidelines

- This project uses a hybrid organization
- Follow existing patterns when adding new code

## Code Style

### Language: JavaScript

### Naming Conventions

| Element | Convention |
|---------|------------|
| Files | kebab-case |
| Functions | camelCase |
| Classes | PascalCase |
| Constants | SCREAMING_SNAKE_CASE |

### Import Style: Relative Imports

### Export Style: Named Exports


*Preferred import style*

```javascript
// Use relative imports
import { Button } from '../components/Button'
import { useAuth } from './hooks/useAuth'
```

*Preferred export style*

```javascript
// Use named exports
export function calculateTotal() { ... }
export const TAX_RATE = 0.1
```

## Testing

### Test Framework: vitest

### File Pattern: `*.test.js`

### Test Types

- **Unit tests**: Test individual functions and components in isolation
- **Integration tests**: Test interactions between multiple components/services

### Coverage

This project has coverage reporting configured. Aim for 80%+ coverage.


*Test file structure*

```typescript
import { describe, it, expect } from 'vitest'

describe('MyFunction', () => {
  it('should return expected result', () => {
    const result = myFunction(input)
    expect(result).toBe(expected)
  })
})
```

## Error Handling

### Error Handling Style: Try-Catch Blocks


*Standard error handling pattern*

```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('User-friendly message')
}
```

## Common Workflows

These workflows were detected from analyzing commit patterns.

### Feature Development

Standard feature implementation workflow

**Frequency**: ~16 times per month

**Steps**:
1. Add feature implementation
2. Add tests for feature
3. Update documentation

**Files typically involved**:
- `lib/public/js/components/*`
- `lib/public/js/components/general/*`
- `lib/public/js/components/onboarding/*`
- `**/*.test.*`
- `**/api/**`

**Example commit sequence**:
```text
Add macOS support
Setup: support read-only OpenClaw onboarding
Merge main into pr-4-macos and resolve read-only onboarding conflicts.
```

### Test Driven Development

Test-first development workflow (TDD)

**Frequency**: ~3 times per month

**Steps**:
1. Write failing test
2. Implement code to pass test
3. Refactor if needed

**Files typically involved**:
- `**/*.test.*`
- `**/*.spec.*`
- `src/**/*`

**Example commit sequence**:
```text
test: add tests for user validation
feat: implement user validation
```

### Refactoring

Code refactoring and cleanup workflow

**Frequency**: ~5 times per month

**Steps**:
1. Ensure tests pass before refactor
2. Refactor code structure
3. Verify tests still pass

**Files typically involved**:
- `src/**/*`

**Example commit sequence**:
```text
Merge main into pr-4-macos and resolve read-only onboarding conflicts.
docs(plan): add macOS PR implementation plan for feature/MacOS-post-install
merge: upstream/main (0.9.3) into pr-4-macos + resolve read-only onboarding conflicts
```


## Best Practices

Based on analysis of the codebase, follow these practices:

### Do

- Use conventional commit format (feat:, fix:, etc.)
- Write tests using vitest
- Follow *.test.js naming pattern
- Use kebab-case for file names
- Prefer named exports

### Don't

- Don't write vague commit messages
- Don't skip tests for new features
- Don't deviate from established patterns without discussion

---

*This skill was auto-generated by [ECC Tools](https://ecc.tools). Review and customize as needed for your team.*
