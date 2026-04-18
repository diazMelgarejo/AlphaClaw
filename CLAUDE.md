# AlphaClaw macOS Port Implementation Plan

## Save a copy of this file to branch: feature/MacOS-post-install

## Context

`diazMelgarejo/AlphaClaw` is a fork of `chrysb/alphaclaw`. The goal is to port
AlphaClaw to macOS Sonoma (ARM64), make `npm run build:ui` and all tests pass
on a clean Mac, and publish the result as `@diazmelgarejo/alphaclaw@0.9.9.6`

---

## Branch Roles (AUTHORITATIVE — do not deviate)

| Branch | Role | Rules |
|---|---|---|
| `main` | Upstream mirror of `chrysb/alphaclaw` | NO local changes. Currently 0.9.9.0 |
| `pr-4-macos` | Official PR awaiting maintainer review | NO version bumps. Respect upstream versioning. One-way merge FROM main only, once per session start. Final sanitized changes from feature branch are cherry-picked here. |
| `feature/MacOS-post-install` | **Persistent memory + build hub** | Rebased on top of latest `pr-4-macos`. Version 0.9.9.6 for local dev only. ALL plans, lessons, and TODO lists are saved and committed here. |
| `claude/publish-alphaclaw-macos-WmewH` | AI agent coworking space | Agents and subagents do all active work here. ALL lessons and plans are copied back to `feature/MacOS-post-install` before session ends. |

**Data flow:**

```
upstream/chrysb/main → our main (mirror)
                   ↓ (once per session, one-way)
              pr-4-macos
                   ↓ (rebase)
     feature/MacOS-post-install  ←→  claude/publish-alphaclaw-macos-WmewH
                   ↑                        (work here, sync plans back)
        cherry-pick sanitized fixes
```

---

## A — Sync main with upstream (first step every session)

Upstream is at 0.9.9 (our local env still shows 0.9.6 — we are behind):

```bash
git remote add upstream https://github.com/chrysb/alphaclaw.git 2>/dev/null || true
git fetch upstream main
git checkout main

git merge --ff-only upstream/main   # fast-forward only; abort if diverged
git push -u origin main
```

Then update the working branch:

```bash
git checkout claude/publish-alphaclaw-macos-WmewH
git merge --ff-only main
```

---

## B — Refresh pr-4-macos from main (once per session)

`pr-4-macos` already contains the macOS commits. Only sync upstream changes 
into it — never add version bumps or experimental code here.

```bash
git fetch origin pr-4-macos
git checkout pr-4-macos
git merge --ff-only main   # bring in any new upstream commits from step A
git push -u origin pr-4-macos
```

If `--ff-only` fails (diverged), use `git merge main` and resolve conflicts
conserving the pr-4-macos macOS additions.

---

## C — Rebase feature/MacOS-post-install onto pr-4-macos

`feature/MacOS-post-install` is stale. Rebase it:

```bash
git fetch origin feature/MacOS-post-install
git checkout -b feature/MacOS-post-install origin/feature/MacOS-post-install

# Replay only our commits (docs plan) on top of updated pr-4-macos
git rebase --onto pr-4-macos 4cba0d8 feature/MacOS-post-install

# cef44656 = old "Merge main into pr-4-macos" March 2026 base commit
git push -u origin feature/MacOS-post-install --force-with-lease
```

**Commit this plan file** to `feature/MacOS-post-install` as
`docs/plans/macos-port-canonical.md` so it survives branch switches.

---

## D — What pr-4-macos already contains (do NOT redo)

| Commit | What it does |
|---|---|
| `fix(macos): extract bin-path into lib/platform.js` | darwin → `~/.local/bin`, linux → `/usr/local/bin` |
| `fix(platform): address review feedback` | top-level `fs` require, `mkdirSync` on darwin |
| `fix(gateway): ensure models array` | `sanitizeOpenclawConfig()` prevents 30s gateway timeout |
| `fix(gateway): harden sanitizeOpenclawConfig` | null/array-typed provider guards + tests |
| `merge: upstream 0.9.3 into pr-4-macos` | full conflict resolution preserving read-only onboarding |
| `fix: resolve 3 test failures` | routes/system.js, onboarding read-only guards |
| `fix(macos): scheduler activation + cron validation` | numeric-only cron tokens, `startManagedScheduler()` on darwin |

---

## E — M2 MacBook Sandbox Testing

AlphaClaw is a **Node.js project** — VS Code is the primary IDE. Xcode is NOT
used to build or run AlphaClaw itself. However, on your M2 MacBook Pro, Xcode
26.3+ provides `xcrun mcpbridge`, which gives Claude Code CLI an MCP channel
into the macOS environment (file system, build tools, macOS APIs). This is
useful for sandboxed testing on macOS but **not** for the Node.js build itself.

### Two-IDE setup (VS Code + Xcode 26.3 on M2)

```
VS Code                         Xcode 26.3+
──────────────────────          ──────────────────────────────────
Primary dev IDE for             MCP bridge to macOS-native tools
Node.js/AlphaClaw work          (launchctl, codesign, xcrun, etc.)
Claude Code extension           xcrun mcpbridge
     │                               │
     └──────── Claude Code CLI ──────┘
               (shared session)
```

**Xcode 26.5 MCP setup (one-time, M2 MacBook only):**

```bash
# 1. Requires Xcode 26.5+ 
#    Enable in: Xcode → Settings → Intelligence → Model Context Protocol → Xcode Tools: ON

# 2. Connect Claude Code CLI to Xcode's MCP bridge
claude mcp add --transport stdio xcode -- xcrun mcpbridge


# 3. Verify
claude mcp list
# Should show: xcode (stdio) — xcrun mcpbridge

```

**Important operational notes:**

- Xcode must be running with a project open for `mcpbridge` to work. You can
  open the AlphaClaw folder as a directory (not an .xcodeproj) for file navigation.

- A dialog "Allow [agent] to access Xcode?" appears for each new agent PID.
  For unattended testing, use an AppleScript auto-dismiss workaround.

- Xcode creates a restricted shell — it does NOT inherit `~/.zshrc`. Use
  absolute paths in MCP tool commands and explicitly define PATH.

- Requires Claude Pro, Max, Team, or Enterprise subscription (shared 5h window).
- App Store Connect uploads must use Xcode 26+ as of April 28, 2026.

**What `xcrun mcpbridge` enables for this project:**

- Triggering `launchctl load` / `launchctl list` to test LaunchAgents (E.3)
- Verifying ARM64 binary resolution (`file ~/.local/bin/gog`)
- macOS-native file permission checks without leaving Claude Code
- Does NOT help with Node.js builds — that's still `npm` in the terminal

The sandbox testing workflow on your M2 MacBook Pro:

### Prerequisites

```bash
# Verify native ARM64 shell (critical for esbuild binary selection)
uname -m   # must print "arm64", NOT "x86_64"

# If x86_64: you are in a Rosetta 2 shell — open a new native terminal

# Node.js via Homebrew (recommended for M2)
brew install node@22
brew link --overwrite node@22
node --version   # >= 22.14.0


# Or via nvm (also fine):
nvm install 22 && nvm use 22


# Set npm prefix for sudo-free global installs
npm config set prefix ~/.local
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

```

### Install + build from the feature branch

```bash
cd ~/Projects/AlphaClaw   # or wherever you cloned it
git checkout feature/MacOS-post-install
npm install
npm run build:ui
npm test                  # 440 tests
npm run test:watchdog     # 14 tests

```

### Runtime smoke test

```bash
# Create .env with required vars

echo "SETUP_PASSWORD=localdev123" > .env


node bin/alphaclaw.js start

# Watch startup logs for:

# ✓ [alphaclaw] git auth shim installed   → should be in ~/.local/bin/git
# ✓ [alphaclaw] gog CLI installed         → should be in ~/.local/bin/gog

# ✗ NO writes to /usr/local/bin or /etc/cron.d (would log "skipped: EACCES")
# ✓ [alphaclaw] Setup complete -- starting server

# Open http://localhost:3000 and complete the setup wizard

```

### Error log during builds

Keep a running log in `feature/MacOS-post-install` at `docs/build-errors-macos.md`.
For each error: platform (Sonoma + chip), Node version, error message, fix applied.
This becomes the regression test record for future contributors.

---

## F — CLAUDE.md for the AlphaClaw Repository

A `CLAUDE.md` in the repo root gives Claude Code agents context so they don't

re-learn the architecture every session. Commit this to `feature/MacOS-post-install`

(and cherry-pick to `pr-4-macos` when it stabilizes).

Suggested content for `/home/user/AlphaClaw/CLAUDE.md`:

```markdown

# AlphaClaw — Claude Code Context



## Project overview

AlphaClaw is a Node.js ≥ 22.14 setup harness and gateway manager for OpenClaw.
It is NOT a Swift/native app. Do not use Xcode tooling.

Stack: Express + http-proxy + Preact (htm) + Tailwind + Vitest.


## Branch roles

- main: upstream mirror of chrysb/alphaclaw — NO local commits
- pr-4-macos: official PR branch — no version bumps, no experiments
- feature/MacOS-post-install: learning hub — all plans/lessons saved here
- claude/publish-alphaclaw-macos-WmewH: AI working branch — sync back to feature branch before ending session



## Key invariants (never break these)

- Read-only onboarding mode must remain gated: `if (!validatedReadOnlyMode)` in lib/server/onboarding/index.js
- SETUP_PASSWORD check at bin/alphaclaw.js:492 is a security gate, not a bug
- Do not write to /usr/local/bin, /etc/cron.d on darwin — use ~/.local/bin and ~/Library/LaunchAgents
- sanitizeOpenclawConfig() must run before any gateway spawn (models:[] guard)



## Running tests

npm test                  # full suite (440)
npm run test:watchdog     # watchdog suite (14)
npm run build:ui          # required before local runs



## macOS-specific

- Always verify `uname -m` = arm64 before npm install (esbuild arch mismatch)

- npm config set prefix ~/.local required for sudo-free installs

- LaunchAgents plist at ~/Library/LaunchAgents/com.alphaclaw.hourly-sync.plist
  replaces /etc/cron.d on darwin



## Publishing

- Package scope: @diazmelgarejo/alphaclaw (lowercase, npm requirement)
- Version 0.9.6 on feature branch only — pr-4-macos follows upstream versioning
- npm publish --access public (prepack runs build:ui automatically)



## Files to know

- bin/alphaclaw.js        — CLI entry, startup, shim installs, cron setup
- lib/platform.js         — darwin/linux path routing (getBinPath)
- lib/server.js           — Express app init
- lib/server/onboarding/index.js — read-only mode guard (critical)
- lib/server/watchdog.js  — self-healing gateway monitor
- scripts/apply-openclaw-patches.js — npm patch-package runner (NOT hardware-aware)

```

### Where CLAUDE.md lives

- **Repository root** (`/home/user/AlphaClaw/CLAUDE.md`) — picked up automatically
  by `claude` CLI (VS Code extension and CLI) when you `cd` into the repo.

- Claude Code reads this on every session start — no additional configuration needed.
- For global preferences that apply across all repos, use `~/.claude/CLAUDE.md`.

- **Xcode 26.5 Beta**: The built-in Claude agent also reads `CLAUDE.md` from the
  project root. Xcode agent config lives at:
  `~/Library/Developer/Xcode/CodingAssistant/ClaudeAgentConfig/.claude.json`
  but you do not need to edit it — `CLAUDE.md` in the repo root is sufficient.

---

## Learning Hub

All agent skills and lessons are organized as a linked wiki. **Read before coding.**

| Resource | Purpose |
| --- | --- |
| [`SKILL.md`](SKILL.md) | **Start here.** Agent behavioral rules — every "never" with commands |
| [`docs/wiki/README.md`](docs/wiki/README.md) | Wiki index — links to all 9 lesson pages |
| [`docs/wiki/09-session-checklist.md`](docs/wiki/09-session-checklist.md) | Full session startup/shutdown command sequence |
| [`docs/Lessons.MD`](docs/Lessons.MD) | Chronological lesson log |
| [`docs/macos-post-install-lessons.md`](docs/macos-post-install-lessons.md) | PR #63 deep-dive: root causes, fixes, test coverage |

**Critical skills (read these first):**

- [01 — Branch Roles](docs/wiki/01-branch-roles.md) — which branch, which purpose
- [07 — Duplicate Files](docs/wiki/07-duplicate-files.md) — run the dupe check before any file work
- [05 — Merge Conflicts](docs/wiki/05-merge-conflicts.md) — onboarding guard invariant

---

## Session Checklist (run at start of each session)

- [ ] Sync main from upstream (`git fetch upstream && git merge --ff-only`)
- [ ] Merge main into pr-4-macos (one-way, once)
- [ ] Rebase feature/MacOS-post-install onto latest pr-4-macos
- [ ] Commit any plan/lesson updates to feature/MacOS-post-install
- [ ] Do all active work on claude/publish-alphaclaw-macos-WmewH
- [ ] Before session ends: copy lessons/plan updates back to feature/MacOS-post-install
- [ ] Log any macOS build errors to docs/build-errors-macos.md on feature branch
- [ ] Final sanitized changes from feature branch(es) are cherry-picked ->pr-4-macos.

## To Do List = ./TODO.md

## Helper Scripts (run on demand, never automatic)

| Script | Purpose |
| --- | --- |
| `bash scripts/step1-sync-main.sh` | Sync local main from upstream chrysb/alphaclaw |
| `bash scripts/step2-main-to-pr-branch.sh` | Merge upstream main into pr-4-macos (creates backup tag first) |
