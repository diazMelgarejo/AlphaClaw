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

```bash
# 1. Sync main with upstream
git remote add upstream https://github.com/chrysb/alphaclaw.git 2>/dev/null || true
git fetch upstream main
git checkout main && git merge --ff-only upstream/main
git push -u origin main

# 2. Bring upstream changes into pr-4-macos
git checkout pr-4-macos
git merge --ff-only main   # abort if this fails; investigate divergence

# 3. Rebase feature branch onto updated pr-4-macos
git checkout feature/MacOS-post-install
git rebase origin/feature/MacOS-post-install   # get remote-only commits first
git rebase pr-4-macos                           # then rebase onto pr-4-macos tip
```

See [09 — Session Startup Checklist](09-session-checklist.md) for the full sequence.

---

## Why This Structure

- `main` must be a clean upstream mirror so we can always `ff-only` merge. One local commit contaminates this forever.
- `pr-4-macos` must be PR-reviewable: no version bumps, no docs clutter, no experiments. Upstream reviewers only see what belongs in the PR.
- `feature/MacOS-post-install` acts as the "brain" — plans and lessons survive branch switches and force-pushes to the working branch.
- The agent branch is disposable. Plans and lessons must be copied out before it's abandoned.

---

## Related

- [09 — Session Startup Checklist](09-session-checklist.md)
- `CLAUDE.md` § Branch Roles — authoritative source
