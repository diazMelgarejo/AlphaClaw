# 08. Subagent Bash Permissions

**TL;DR:** Agents dispatched via the Agent tool (background or foreground) do NOT inherit the parent session's Bash permission grants. Any agent needing `git`, `npm`, or shell commands will silently fail and return nothing useful.

---

## What Happened

Two background agents were dispatched in parallel to:
- Agent A: read `feature/MacOS-post-install` git history and extract lessons
- Agent B: run `npm test` on `pr-4-macos` and fix failures

Both returned immediately with "I need Bash permission to proceed." Neither did any work. ~18s and ~11s of token spend wasted.

---

## Root Cause

Claude Code's permission system is **session-scoped**. When you approve a Bash tool call in your session, that approval applies to your session's process. Agents spawned via the `Agent` tool run in isolated sub-sessions with their own permission state. They start with no Bash permission regardless of what the parent session has granted.

---

## Rules

**Rule 1:** Keep all shell work (git, npm test, file writes) in the parent session.

**Rule 2:** Only dispatch subagents for tasks that need only: `Read`, `Grep`, `Glob`, `Write`, `Edit` — pure file analysis or file creation.

**Rule 3:** If you must dispatch an agent to do shell work, pass the shell output directly in the prompt:

```markdown
Here is the output of `npm test` run from the parent session:

[paste full test output]

Based on this output, diagnose the root cause and propose a targeted fix.
Return: the exact file path, line number, and replacement code.
```

The agent then does analysis (no shell needed) and returns a fix you apply in the parent session.

---

## When Subagents Are Useful in This Repo

| Good use | Reason |
|----------|--------|
| "Read `lib/server/onboarding/index.js` and map all write paths" | Pure file reads |
| "Search for all callers of `sanitizeOpenclawConfig`" | Grep only |
| "Given this test output [pasted], find root cause" | Analysis only |
| "Write a lessons doc based on these facts [provided]" | File creation |

| Bad use | Reason |
|---------|--------|
| "Run `npm test` and fix failures" | Needs Bash |
| "Check out `pr-4-macos` and verify tests pass" | Needs Bash |
| "Review git log and extract lessons" | Needs Bash for git commands |

---

## Alternative: Grant Bash Globally

If you want subagents to run shell commands, grant Bash permission globally in Claude Code settings (`settings.json`). This removes the per-session prompt. Be aware this applies to all agents in all sessions.

---

## Related

- [09 — Session Startup Checklist](09-session-checklist.md)
- [2026-04-16 session log](../superpowers/plans/2026-04-16-session-lessons.md)
