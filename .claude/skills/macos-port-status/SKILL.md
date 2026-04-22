---
name: macos-port-status
description: Show AlphaClaw macOS port branch sync status, cherry-pick gaps, and test health
---

Check AlphaClaw macOS port status:

```bash
# Commits in feature not yet cherry-picked to pr-4-macos
git log --oneline feature/MacOS-post-install ^pr-4-macos | head -15

# Commits in pr-4-macos not yet in main (upstream PR delta)
git log --oneline pr-4-macos ^main | head -15

# Test health
npm test --reporter=dot 2>&1 | tail -8

# LM Studio endpoint status
~/.openclaw/scripts/discover.py --status
```

Report: which commits need cherry-picking, whether any pr-4-macos commits contain fork-specific files, test summary, endpoint health.
