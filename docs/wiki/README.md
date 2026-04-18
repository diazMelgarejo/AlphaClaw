# AlphaClaw Knowledge Wiki

> **For agents:** Read this at session start. Every lesson here was earned from a real bug or real lost time.
> **For humans:** Each page has a TL;DR at the top. Start there.

---

## Pages

| # | Topic | TL;DR |
|---|-------|-------|
| [01](01-branch-roles.md) | Branch Roles & Data Flow | Never commit to `main`. Work on `pr-4-macos`, save lessons to `feature/MacOS-post-install`. |
| [02](02-macos-bin-path.md) | macOS Bin-Path & SIP | Darwin routes shims to `~/.local/bin`, not `/usr/local/bin`. SIP blocks the latter. |
| [03](03-gateway-config.md) | Gateway Config Sanitization | Every provider in `openclaw.json` must have `models: []`. Missing it = 30s silent timeout. |
| [04](04-cron-scheduler.md) | macOS Cron / LaunchAgent | `/etc/cron.d` is root-only on macOS. Use the in-process managed scheduler. Named cron tokens crash the parser. |
| [05](05-merge-conflicts.md) | Merge Conflict Patterns | Read-only onboarding guard must stay inside `!validatedReadOnlyMode`. Re-run onboarding tests after any conflict. |
| [06](06-vitest-sqlite-flake.md) | Vitest + SQLite WAL Flake | Parallel vitest workers race on WAL locks → 60s timeout. Fix: `singleFork: true`. |
| [07](07-duplicate-files.md) | Prevent Duplicate Files | macOS "keep both" creates `file 2.js`. Never use Finder on tracked files. Run the dupe check command. |
| [08](08-subagent-bash-permissions.md) | Subagent Bash Permissions | Dispatched agents don't inherit Bash grants. Shell work stays in parent session. |
| [09](09-session-checklist.md) | Session Startup Checklist | Commands to run at the start of every session before touching any code. |

---

## How This Wiki Works

- Each page is a standalone lesson: **TL;DR → Root Cause → Fix → Rule → Links**
- `SKILL.md` at the repo root is the agent-facing entry point — it indexes skills and links here
- `CLAUDE.md` has a **Learning Hub** section that points agents at this wiki
- `docs/Lessons.MD` is the chronological log — this wiki is the organized, cross-linked reference

---

## Adding a New Lesson

1. Create `docs/wiki/NN-topic-slug.md` using this template:

```markdown
# NN. Topic Title

**TL;DR:** One sentence that fits in a tweet.

---

## Root Cause
## Fix
## Rule (Never / Always)
## Verification
## Related
```

2. Add a row to the table above in this `README.md`
3. Add a line to `docs/Lessons.MD`
4. If it's an agent behavior rule, add it to `SKILL.md`

---

*Last updated: 2026-04-16*
