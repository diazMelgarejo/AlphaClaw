# 01. Branch Roles & Data Flow

**TL;DR:** Four branches, four distinct jobs. Never commit code to `main`. Work on `pr-4-macos`, save lessons to `feature/MacOS-post-install`.

---

## Branch Map

| Branch | Role | Hard Rules |
|--------|------|-----------|
| `main` | Mirror of `chrysb/alphaclaw` upstream | **NO local commits.** Fast-forward only from upstream. |
| `pr-4-macos` | Active PR branch (PR #63 → chrysb/alphaclaw) | No version bumps. No experimental code. One-way merge FROM main only, once per session. |
| `feature/MacOS-post-install` | **Persistent memory + documentation hub** | All plans, lessons, session logs committed here. Rebased on top of `pr-4-macos`. Version 0.9.6 for local dev only. |
| `claude/publish-alphaclaw-macos-WmewH` | AI agent working space | All active work happens here. Sync lessons back to `feature/MacOS-post-install` before ending session. |

---

## Data Flow

```
upstream chrysb/alphaclaw:main
        ↓  (git fetch + ff-only, once per session)
    our main
        ↓  (git merge --ff-only main, once per session)
    pr-4-macos
        ↓  (git rebase --onto pr-4-macos)
feature/MacOS-post-install  ←→  claude/publish-alphaclaw-macos-WmewH
        ↑                         (work here, sync plans back)
cherry-pick sanitized fixes
```

---

## Session Start Sequence

See [09 — Session Startup Checklist](09-session-checklist.md) for the full
command sequence. Short form: sync main → merge into pr-4-macos → rebase feature branch.

---

## Why This Structure

- `main` must be a clean upstream mirror so we can always `ff-only` merge. One local commit contaminates this forever.
- `pr-4-macos` must be PR-reviewable: no version bumps, no docs clutter, no experiments. Upstream reviewers only see what belongs in the PR.
- `feature/MacOS-post-install` acts as the "brain" — plans and lessons survive branch switches and force-pushes to the working branch.
- The agent branch is disposable. Plans and lessons must be copied out before it's abandoned.

---

## Subset-Superset Commit Strategy

**Rule: every commit that goes to a narrower branch must also exist in every wider branch.**

```
upstream PR  ⊂  pr-4-macos  ⊂  feature/MacOS-post-install
```

| Layer | Branch / PR | What goes here |
| --- | --- | --- |
| **Narrowest** | upstream PR to `chrysb/alphaclaw` | Standalone fixes that benefit upstream independently — test cleanup, CI fixes. No macOS-specific code. |
| **Middle** | `pr-4-macos` | Everything in the upstream PR **plus** macOS port changes (E.1–E.5: esbuild deps, LaunchAgent, CI matrix). No fork-specific branding. |
| **Widest** | `feature/MacOS-post-install` | Everything above **plus** fork-specific additions: scope rename (.npmrc), patch-package label, MCP server, local-agent library, Xcode integration scripts, all docs/wiki/lessons. |

### How to split work across layers

Ask these questions in order:

1. **Would this fix help any user of `chrysb/alphaclaw`, not just macOS?**
   - YES → it belongs in an upstream PR (narrowest layer).
2. **Is this fix macOS-specific but still clean enough for upstream review?**
   - YES → it belongs in `pr-4-macos` but NOT a separate upstream PR.
3. **Is this fork-specific (branding, local tooling, personal workflow)?**
   - YES → it belongs ONLY in `feature/MacOS-post-install`.

### Concrete examples (2026-04-19)

| Change | Layer | Reason |
| --- | --- | --- |
| `routes-browse afterEach cleanup` | upstream PR | Platform-agnostic test fix |
| `routes-models afterEach cleanup` | upstream PR | Platform-agnostic test fix |
| `vitest.config testTimeout 10 000ms` | upstream PR | Helps any macOS contributor |
| `@esbuild/darwin-arm64 optionalDependency` | pr-4-macos only | macOS-specific |
| `LaunchAgent plist writer in bin/alphaclaw.js` | pr-4-macos only | macOS-specific |
| `CI matrix macos-latest` | pr-4-macos only | macOS-specific |
| `.npmrc scope @diazmelgarejo` | feature only | Fork branding |
| `lib/mcp/alphaclaw-mcp.js` | feature only | Not for upstream |
| `lib/agents/orchestrator.js` | feature only | Separate work, not for upstream |
| `docs/wiki/**` | feature only | Fork-specific learning hub |

### Workflow when adding new commits

```bash
# 1. Ask which layer the change belongs to.
# 2. Commit to feature/MacOS-post-install first (widest, always safe).
# 3. If it belongs to pr-4-macos, cherry-pick it there.
# 4. If it belongs to an upstream PR, cherry-pick it onto fix/<name> (based on main).
# 5. Merge pr-4-macos into feature to keep feature as superset.

git cherry-pick <sha>              # from feature → pr-4-macos or fix/<name>
git merge pr-4-macos               # from feature branch to absorb new pr-4-macos commits
```

**Never commit fork-specific code to `pr-4-macos` or an upstream PR branch.**
**Never leave `feature` as a subset of `pr-4-macos`.**

---

## Related

- [09 — Session Startup Checklist](09-session-checklist.md)
- `CLAUDE.md` § Branch Roles — authoritative source
