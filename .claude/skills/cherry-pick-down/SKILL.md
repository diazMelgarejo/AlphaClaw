---
name: cherry-pick-down
description: Safely cherry-pick a commit from feature/MacOS-post-install down to pr-4-macos with upstream-compat check
disable-model-invocation: true
---

Before cherry-picking any commit to pr-4-macos:

**1. Confirm tests pass:**
```bash
npm test --reporter=dot 2>&1 | tail -5
```

**2. Check commit for fork-specific files (must be absent):**
These NEVER go to pr-4-macos: `.npmrc` (@diazmelgarejo scope), `scripts/apply-openclaw-patches.js`, `lib/mcp/`, `lib/agents/`, `.mcp.json`, `docs/wiki/`

```bash
git show <sha> --name-only | grep -E "lib/mcp|lib/agents|apply-openclaw|\.mcp\.json|docs/wiki"
```
Any match → STOP.

**3. Cherry-pick with review:**
```bash
git cherry-pick <sha> --no-commit
git diff --staged   # review carefully
git commit          # use original message
git push origin pr-4-macos
```
