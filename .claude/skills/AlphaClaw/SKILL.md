---
name: alphaclaw
description: >-
  Teaches AlphaClaw development conventions for the JavaScript Express fork of
  OpenClaw: conventional commits, cross-platform support (Linux, macOS, Windows),
  upstream merge discipline, Vitest testing, ECC bundle hygiene, and
  documentation workflows. Activates when working in AlphaClaw, merging upstream
  OpenClaw, adding platform support, writing AlphaClaw tests, updating the ECC
  bundle, running check-ecc-manifest, or following fork conventions.
version: 1.0.0
license: Apache 2.0
compatibility: claude-code, cursor, codex, ecc
parent_skill: alphaclaw
triggers:
  - AlphaClaw conventions
  - alphaclaw development
  - alphaclaw-conventions
  - merge upstream OpenClaw
  - platform support AlphaClaw
  - /feature
  - /merge-upstream
  - /platform-support
  - /fix-tests
  - /add-lesson
  - /ci-update
  - ECC bundle AlphaClaw
  - check-ecc-manifest
  - AlphaClaw Express fork
allowed-tools: bash, file-operations, web-search
preconditions:
  - AlphaClaw repository checkout
  - Node 22.22.3 or newer
constraints:
  - Express 4 semantics only — do not assume Express 5
  - Vitest for tests — never pytest patterns in this JavaScript repo
metadata:
  surfaces:
    - ide
    - cli
---

# AlphaClaw — development conventions

> OSSF-1 orchestrator. Source synthesis: GitHub `478fe08` + ECC PR #30 lineage.
> Deep detail lives in `references/` (one level only).

## Purpose

Equip agents with AlphaClaw fork conventions: Express setup layer, platform
detection, upstream merge discipline, Vitest coverage, and ECC manifest
integrity — without duplicating upstream OpenClaw docs.

## When to Use

- Editing `bin/alphaclaw.js`, `lib/server/`, `lib/platform.js`, or setup UI
- Merging `upstream/main` or resolving fork conflicts
- Adding or fixing macOS, Linux, or Windows support
- Writing or fixing `tests/server/` or `tests/frontend/` suites
- Regenerating or validating `.claude/` / `.agents/skills/AlphaClaw/` ECC bundle
- Updating `docs/Lessons.MD`, `docs/wiki/`, `AGENTS.md`, or `CLAUDE.md`

## Instructions

1. **Load context** — read only the references needed for the task (see References).
2. **Match existing patterns** — kebab-case files, named exports, relative imports.
3. **Ship with tests** — add or update Vitest suites for behavioral changes.
4. **Document** — update lessons/wiki when the fix is non-obvious.
5. **Verify ECC** — after merges touching `.claude/` or `.agents/`, run
   `bash scripts/check-ecc-manifest.sh`.
6. **Rebuild UI** — after `lib/public/` changes, run `npm run build:ui`.
7. **Integrative merge** — synthesize upstream + fork changes; never amputate
   ECC bundle files silently.

### Quick workflow routing

| Intent | Command | Reference |
|--------|---------|-----------|
| New feature / fix | `/feature` | [`references/workflows.md`](references/workflows.md) |
| Upstream merge | `/merge-upstream` | [`references/workflows.md`](references/workflows.md) |
| OS-specific work | `/platform-support` | [`references/workflows.md`](references/workflows.md) |
| Failing tests | `/fix-tests` | [`references/code-style-commits-testing.md`](references/code-style-commits-testing.md) |
| Lessons / wiki | `/add-lesson` | [`references/workflows.md`](references/workflows.md) |
| CI matrix | `/ci-update` | [`references/workflows.md`](references/workflows.md) |

## Boundaries

### Always Do

- Use conventional commits (`feat:`, `fix:`, `merge:`, `test:`, `docs:`, `chore:`).
- Write Vitest tests (`*.test.js`) for new behavior.
- Run `npm test` before marking work complete.
- Run `bash scripts/check-ecc-manifest.sh` after ECC-touching merges.
- Update **both** `AGENTS.md` and `CLAUDE.md` when agent instructions change.
- Mock `process.platform` when test names claim platform-specific behavior.

### Ask First

- Changing `package.json` engines or major dependency versions.
- Altering `.github/workflows/ci.yml` OS matrix.
- Regenerating the full ECC bundle or instincts manifest.
- Deleting or renaming files under `.claude/` or `.agents/`.

### Never Do

- Hand-edit `~/.openclaw/` when the installer owns that state.
- Let upstream merges silently drop ECC bundle paths — restore additively.
- Use pytest patterns or Python test markers in this repo.
- Assume Express 5 semantics (project is Express 4).
- Skip tests for new features or platform branches.
- Deviate from established patterns without discussion.

## Examples

### Golden path — feature with test

```js
// lib/server/new-feature.js
export function newFeature() {
  return true;
}
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

### Golden path — post-merge verification

```sh
npm install
bash scripts/check-ecc-manifest.sh
npm test
```

## References

| Topic | File |
|-------|------|
| Tech stack, layout, config | [`references/architecture-and-stack.md`](references/architecture-and-stack.md) |
| Naming, commits, Vitest, errors | [`references/code-style-commits-testing.md`](references/code-style-commits-testing.md) |
| `/feature`, `/merge-upstream`, commands | [`references/workflows.md`](references/workflows.md) |
| ECC synthesis lineage | [`references/synthesis-lineage.md`](references/synthesis-lineage.md) |
| Repo agent instructions | `AGENTS.md`, `CLAUDE.md` |
| Session lessons | `docs/Lessons.MD`, `docs/wiki/` |

## Eval gate (OSSF-1)

- [ ] Frontmatter complete (`name`, `description`, `version`, `triggers`, `compatibility`, `allowed-tools`)
- [ ] Body ≤200 lines; deep content in `references/`
- [ ] Boundaries: Always / Ask / Never present
- [ ] ≥1 golden-path example
- [ ] No hardcoded secrets or personal absolute paths
- [ ] Triggers cover paraphrased AlphaClaw / upstream-merge queries
