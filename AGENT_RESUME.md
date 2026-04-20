# AlphaClaw — Agent Resume Guide

**Repo:** diazMelgarejo/AlphaClaw
**Active branch:** `feature/MacOS-post-install`
**Last updated:** 2026-04-20

## What this repo is
macOS port of `chrysb/alphaclaw` — the OpenClaw setup harness. Manages a 5-branch strategy. Dependency base for Perpetua-Tools and orama-system.

## Branch strategy (NEVER DEVIATE)
| Branch | Role |
|--------|------|
| `main` | Upstream mirror — NO local changes |
| `pr-4-macos` | Official upstream PR — no fork-specific code |
| `feature/MacOS-post-install` | All plans, lessons, fork add-ons live here |
| `fix/<name>` | Narrowest-scope upstream branches |

Cherry-pick direction: feature → pr-4-macos only. Use `/cherry-pick-down`. Use `/upstream-compat-reviewer` before any cherry-pick.

## LM Studio (auto-discovered)
Run `~/.openclaw/scripts/discover.py --status` to see live endpoints.
Discovery runs automatically on every Claude Code SessionStart via `scripts/discover-lm-studio.sh`.

## Quick checks
```bash
npm test --reporter=dot       # must pass before any cherry-pick
/macos-port-status            # branch sync summary
```

## Key files
- `CLAUDE.md` — branch rules (authoritative)
- `.claude/skills/` — macos-port-status, cherry-pick-down
- `.claude/agents/upstream-compat-reviewer.md`
- `scripts/discover-lm-studio.sh` — Layer B gossip gate
