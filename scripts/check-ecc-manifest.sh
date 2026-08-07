#!/usr/bin/env bash
# ECC bundle manifest guard — fails CI if integrative ECC artifacts are missing or regressed.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

MIN_INSTINCTS="${ECC_MIN_INSTINCTS:-45}"
MIN_INSTINCT_LINES="${ECC_MIN_INSTINCT_LINES:-900}"

REQUIRED_PATHS=(
  ".claude/ecc-tools.json"
  ".agents/skills/AlphaClaw/SKILL.md"
  ".agents/skills/AlphaClaw/agents/openai.yaml"
  ".claude/skills/AlphaClaw/SKILL.md"
  ".claude/commands/feature-development.md"
  ".claude/commands/refactoring.md"
  ".claude/commands/test-driven-development.md"
  ".claude/identity.json"
  ".claude/homunculus/instincts/inherited/AlphaClaw-instincts.yaml"
  ".codex/AGENTS.md"
  ".codex/config.toml"
  ".codex/agents/docs-researcher.toml"
  ".codex/agents/explorer.toml"
  ".codex/agents/reviewer.toml"
)

echo "[ecc-manifest] checking ${#REQUIRED_PATHS[@]} required paths"
for path in "${REQUIRED_PATHS[@]}"; do
  if [[ ! -f "$path" ]]; then
    echo "[ecc-manifest] MISSING required file: $path" >&2
    exit 1
  fi
done

INSTINCTS_FILE=".claude/homunculus/instincts/inherited/AlphaClaw-instincts.yaml"
INSTINCT_COUNT="$(rg -c '^id:' "$INSTINCTS_FILE" || true)"
INSTINCT_LINES="$(wc -l < "$INSTINCTS_FILE" | tr -d ' ')"

echo "[ecc-manifest] instincts: count=$INSTINCT_COUNT lines=$INSTINCT_LINES (min $MIN_INSTINCTS / $MIN_INSTINCT_LINES)"
if [[ "$INSTINCT_COUNT" -lt "$MIN_INSTINCTS" ]]; then
  echo "[ecc-manifest] FAIL: instinct count $INSTINCT_COUNT < $MIN_INSTINCTS" >&2
  exit 1
fi
if [[ "$INSTINCT_LINES" -lt "$MIN_INSTINCT_LINES" ]]; then
  echo "[ecc-manifest] FAIL: instinct lines $INSTINCT_LINES < $MIN_INSTINCT_LINES" >&2
  exit 1
fi

REQUIRED_INSTINCT_IDS=(
  "AlphaClaw-workflow-merge-upstream-and-resolve-conflicts"
  "AlphaClaw-workflow-platform-specific-support-and-testing"
  "alphaclaw-instinct-merge-upstream-workflow"
  "alphaclaw-instinct-platform-support-workflow"
)
for instinct_id in "${REQUIRED_INSTINCT_IDS[@]}"; do
  if ! rg -q "^id: ${instinct_id}$" "$INSTINCTS_FILE"; then
    echo "[ecc-manifest] FAIL: missing required instinct id: $instinct_id" >&2
    exit 1
  fi
done

V0_UNION_IDS=(
  "alphaclaw-instinct-commit-prefix"
  "alphaclaw-instinct-error-handling"
  "alphaclaw-instinct-test-framework"
)
for instinct_id in "${V0_UNION_IDS[@]}"; do
  if ! rg -q "^id: ${instinct_id}$" "$INSTINCTS_FILE"; then
    echo "[ecc-manifest] FAIL: missing v0-union instinct id: $instinct_id" >&2
    exit 1
  fi
done

if head -n 1 ".claude/skills/AlphaClaw/SKILL.md" | rg -q '^```'; then
  echo "[ecc-manifest] FAIL: SKILL.md starts with markdown code fence" >&2
  exit 1
fi

if ! rg -q '^name: alphaclaw-conventions' ".claude/skills/AlphaClaw/SKILL.md"; then
  echo "[ecc-manifest] FAIL: SKILL.md missing alphaclaw-conventions frontmatter" >&2
  exit 1
fi

if ! cmp -s ".claude/skills/AlphaClaw/SKILL.md" ".agents/skills/AlphaClaw/SKILL.md"; then
  echo "[ecc-manifest] FAIL: .claude and .agents SKILL.md are not byte-identical" >&2
  exit 1
fi

echo "[ecc-manifest] OK — ECC bundle present and above regression thresholds"
