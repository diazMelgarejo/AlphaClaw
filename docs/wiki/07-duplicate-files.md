# 07. Prevent Duplicate Files (macOS "Keep Both" Hazard)

**TL;DR:** macOS Finder creates `file 2.js` / `file 3.js` when you copy or drag a tracked file. These silently enter git as new untracked files. Always use terminal commands for tracked files — never Finder.

---

## Root Cause

When macOS detects a filename collision during a copy, drag, or download, it appends ` 2` (or ` 3`, etc.) to the name rather than overwriting. Examples seen in this repo:

```
lib/platform 2.js       lib/platform 3.js
tests/server/platform.test 2.js
lib/server/system-cron 2.js    (+ 3.js)
lib/server/onboarding/state 2.js  (+ 3.js)
scripts/setup-macos-sandbox 2.sh
CLAUDE 2.md
.mcp 2.json
```

The canonical files (`lib/platform.js`, etc.) sometimes don't exist at all — only the numbered copies — because the original was never committed and only the copies were dragged in.

---

## How It Was Found

During the 2026-04-16 session, `find . -name "* 2.*"` returned 13 files. Several had no un-numbered counterpart. Two (`lib/platform.js`, `tests/server/platform.test.js`) had to be created by renaming the `2` copy to the canonical name.

---

## Fix (when dupes already exist)

```bash
# 1. Find all duplicates
find . -name "* 2.*" -o -name "* 3.*" | grep -v node_modules | grep -v .git

# 2. Diff each pair — decide which to keep
diff "lib/platform.js" "lib/platform 2.js"

# 3a. If identical → delete the numbered copy
rm "lib/platform 2.js"

# 3b. If only the numbered copy exists → rename to canonical
cp "lib/platform 2.js" "lib/platform.js"
rm "lib/platform 2.js"

# 3c. If they differ → merge content, keep canonical name, delete numbered
# (read both, incorporate the unique content, save to canonical, delete numbered)

# 4. Stage and commit
git add -A && git commit -m "chore: remove macOS duplicate files"
```

---

## Rule

**Never use Finder (or any GUI) to move, copy, or rename tracked files.**

Use only:
- `git mv old-name.js new-name.js` — for renames tracked by git
- `cp src dest && git rm src` — for copies that need the original removed
- `cp src dest` — for copies where both should exist

---

## Periodic Check Command

Run this at the start of each session or before a PR:

```bash
find . -name "* 2.*" -o -name "* 3.*" | grep -v node_modules | grep -v .git
```

Expected output: empty. Any result is a file that needs triage.

---

## CI Enforcement (optional future improvement)

Add to `package.json` scripts:

```json
"check:dupes": "bash -c 'found=$(find . -name \"* 2.*\" -o -name \"* 3.*\" | grep -v node_modules | grep -v .git); [ -z \"$found\" ] || (echo \"Duplicate files found:\\n$found\" && exit 1)'"
```

Then add `npm run check:dupes` to the CI workflow.

---

## Related

- [09 — Session Startup Checklist](09-session-checklist.md) — dupe check is step 1
- [SKILL.md](../../SKILL.md) — the duplicate file rule is encoded as an agent skill
- Discovered: 2026-04-16 session ([session log](../superpowers/plans/2026-04-16-session-lessons.md))
