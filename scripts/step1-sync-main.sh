#!/usr/bin/env bash
set -euo pipefail
# Sync local main from upstream chrysb/alphaclaw.
# Run on demand only — never run automatically.
git remote add upstream https://github.com/chrysb/alphaclaw.git 2>/dev/null || true
git fetch upstream main
git checkout main
git merge --ff-only upstream/main
git push origin main
echo "[step1] main synced to $(git rev-parse --short HEAD)"
