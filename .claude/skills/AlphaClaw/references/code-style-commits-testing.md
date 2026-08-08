# Code style, commits, and testing

## Naming conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `server-utils.js`, `platform-support.js` |
| Functions | camelCase | `detectPlatform` |
| Classes | PascalCase | — |
| Constants | SCREAMING_SNAKE_CASE | `SUPPORTED_PLATFORMS` |

## Imports and exports

Relative imports and named exports:

```js
import { startServer } from '../server/start-server.js';
```

```js
// lib/platform.js
export function detectPlatform() { /* ... */ }
export const SUPPORTED_PLATFORMS = ['linux', 'darwin'];
```

## Commit conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/) with prefixes: `docs`, `fix`, `chore`, `feat`, `merge`, `test`.

- Average message length: ~62 characters (fork integration commits may be longer).
- Keep first line concise; use imperative mood.
- **Recovery commits** (v0 ECC proto): session salvage may use a `recovery:` prefix with a descriptive body.

### Examples

```text
feat(server): add onboarding route for new users
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

## Testing

- **Framework:** [Vitest](https://vitest.dev/) + Supertest for server routes.
- **Pattern:** `*.test.js` under `tests/server/` or `tests/frontend/`.
- Run `npm install` before `npm test` in fresh checkouts.
- Subprocess / Node integration: `// @vitest-environment node` when needed — never pytest patterns.
- When a test name claims a platform (e.g. "returns darwin on macOS"), mock `process.platform` accordingly.

### Example

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

Aim for meaningful behavioral coverage on routes, watchdog flows, and setup state.

## Error handling

```js
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error('User-friendly message');
}
```
