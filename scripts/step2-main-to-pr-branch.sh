#!/usr/bin/env bash
set -euo pipefail
# Merge upstream main into pr-4-macos.
# Run on demand only — never run automatically.
git fetch origin pr-4-macos
git checkout pr-4-macos
TAG="backup/pr-4-macos-$(date +%Y%m%d-%H%M%S)"
git tag "$TAG"
echo "[step2] Backup tag created: $TAG"
git merge main
echo "[step2] Merge complete. Run: npm test"
