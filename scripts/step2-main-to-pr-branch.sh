#!/usr/bin/env bash
set -euo pipefail
# Merge upstream main into pr-4-macos.
# Run on demand only — never run automatically.
if ! git diff-index --quiet HEAD --; then
  echo "[step2] ERROR: Working tree is dirty. Commit or stash changes first." >&2
  exit 1
fi
git fetch origin pr-4-macos
git checkout pr-4-macos
TAG="backup/pr-4-macos-$(date +%Y%m%d-%H%M%S)"
git tag "$TAG"
git push origin "$TAG"
echo "[step2] Backup tag created and pushed: $TAG"
git merge main || {
  echo "[step2] Merge conflict. Resolve per CLAUDE.md section B: keep pr-4-macos macOS additions, accept main for everything else." >&2
  echo "[step2] After resolving: git add <files> && git commit && npm test" >&2
  exit 1
}
echo "[step2] Merge complete. Run: npm test"
