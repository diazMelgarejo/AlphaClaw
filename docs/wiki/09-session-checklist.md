# 09. Session Startup Checklist

**TL;DR:** Run these commands in order at the start of every session. Skipping them leads to conflicts, stale state, or working on the wrong base.

---

## Full Sequence

```bash
# ── 0. Sanity: check for macOS duplicate files ──────────────────────────────
find . -name "* 2.*" -o -name "* 3.*" | grep -v node_modules | grep -v .git
# Expected: empty. Any output → triage before doing anything else.
# See: docs/wiki/07-duplicate-files.md

# ── 1. Sync main from upstream ───────────────────────────────────────────────
git remote add upstream https://github.com/chrysb/alphaclaw.git 2>/dev/null || true
git fetch upstream main
git checkout main
git merge --ff-only upstream/main
git push -u origin main

# ── 2. Bring upstream changes into pr-4-macos ────────────────────────────────
git checkout pr-4-macos
git fetch origin pr-4-macos
git rebase origin/pr-4-macos     # pull any remote-only commits first
git merge --ff-only main         # bring in new upstream commits from step 1
# If --ff-only fails (diverged): use git merge main and resolve conflicts
# preserving the pr-4-macos macOS additions
git push -u origin pr-4-macos

# ── 3. Sync feature branch ───────────────────────────────────────────────────
git checkout feature/MacOS-post-install
git fetch origin feature/MacOS-post-install
git rebase origin/feature/MacOS-post-install   # get remote-only commits
git rebase pr-4-macos                           # rebase onto pr-4-macos tip
git push -u origin feature/MacOS-post-install

# ── 4. Verify tests pass on pr-4-macos ──────────────────────────────────────
git checkout pr-4-macos
npm install
npm test
# Expected: all green. Fix any failures before starting new work.
```

### Note: Rebasing Over Merge Commits

If `pr-4-macos` has absorbed an upstream merge commit (e.g., after syncing 0.9.9),
`git rebase pr-4-macos` on the feature branch may fail with:

```text
error: Your local changes to the following files would be overwritten by merge
```

This happens because the rebase machinery leaves transient state that overlaps with
commits being applied when a merge commit is in the history. Use `--autostash`:

```bash
git rebase --autostash pr-4-macos
```

The flag stashes any working-tree changes before rebase starts and restores them after.
Discovered during 2026-04-18 when rebasing `feature/MacOS-post-install` onto the 0.9.9 merge.

---

## End-of-Session Checklist

```bash
# ── 1. Commit any plans/lessons to feature/MacOS-post-install ───────────────
git checkout feature/MacOS-post-install
# Add new wiki pages, update docs/Lessons.MD, commit session log
git add docs/ && git commit -m "docs: record <date> session lessons"
git push origin feature/MacOS-post-install

# ── 2. Log macOS build errors if any ────────────────────────────────────────
# Append to docs/build-errors-macos.md:
# Platform, Node version, error message, fix applied

# ── 3. Copy key lessons from agent branch if used ───────────────────────────
# If work was done on claude/publish-alphaclaw-macos-WmewH:
git checkout feature/MacOS-post-install
git cherry-pick <docs-only commits from agent branch>
git push origin feature/MacOS-post-install
```

---

## Quick Health Check

```bash
# Confirm Node version
node --version    # must be >= 22.14.0

# Confirm ARM64 shell on M2 Mac (critical for esbuild binary selection)
uname -m          # must be arm64, NOT x86_64

# Confirm npm prefix is user-writable
npm config get prefix   # should be ~/.local, not /usr/local
```

---

## What Each Step Prevents

| Step | Skipping causes |
|------|----------------|
| 0 — dupe check | Working with `file 2.js` instead of `file.js`; phantom files in commits |
| 1 — sync main | `pr-4-macos` diverges from upstream; merge conflicts grow larger over time |
| 2 — sync pr-4-macos | Rebasing feature branch onto a stale base; missing upstream fixes |
| 3 — sync feature | Local and remote feature branches diverge; push rejected at end of session |
| 4 — run tests | Starting new work on a broken baseline; test failures obscure new regressions |

---

## Related

- [01 — Branch Roles & Data Flow](01-branch-roles.md)
- [07 — Prevent Duplicate Files](07-duplicate-files.md)
- `CLAUDE.md` § Session Checklist
