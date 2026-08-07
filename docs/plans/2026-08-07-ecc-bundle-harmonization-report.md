# ECC Bundle Harmonization Report — AlphaClaw

**Date:** 2026-08-07  
**Scope:** Integrative merge of integration-base ECC artifacts with [PR #30](https://github.com/diazMelgarejo/AlphaClaw/pull/30) (ECC Tools auto-generation)  
**Method:** oramasys-method — synthesize, never amputate  
**Status:** Correct synthesis landed on `ecc-tools/AlphaClaw-1785989223295` (PR #30)

---

## Executive summary

PR #30 (`ecc-tools/AlphaClaw-1785989223295`) auto-generated a 290-line `SKILL.md` and 12-instinct bundle from repository analysis. The integration base on `feature/MacOS-post-install` already held a **166-line hand-crafted `SKILL.md`**, **36 instincts**, and additional fork skills (`cherry-pick-down`, `macos-port-status`, `upstream-compat-reviewer`).

Commit [`eb10e757`](https://github.com/diazMelgarejo/AlphaClaw/commit/eb10e757580ed9f274371aacbc25cace94d602d7) was labeled “harmonize ECC bundle onto integration base (PR #30)” but performed a **replacement**: it kept PR #30’s shorter artifacts and **deleted** 24 fork-specific instincts and 6 operational workflow sections from the integration base.

The **correct synthesis** (formerly draft PR #31, now overlaid on PR #30) preserves **all 36 instincts**, unions `ecc-tools.json` package profiles, and merges PR #30’s structural strengths (frontmatter, tech stack, commit examples, architecture tables) with the integration base’s AlphaClaw operational workflows.

---

## Cross-reference: four versions

| Label | Git ref | Branch / origin | Role |
|-------|---------|-----------------|------|
| **A — Integration base** | `542fdf7` | Pre-merge integration snapshot | Hand-crafted ECC on macOS post-install line |
| **B — PR #30 bot** | `61ff663` | `ecc-tools/AlphaClaw-1785989223295` tip (pre-fix) | ECC Tools auto-generation (2026-08-06) |
| **C — Wrong merge** | `eb10e757` | `2026-08-05-001-mcp-consolidation-to-pt` | Labeled harmonization; actually replaced base with B |
| **D — Correct synthesis** | `94f8a90`+ | PR #30 after harmonization overlay | True integrative merge (A ∪ B) |

**Current integration tip** (`origin/feature/MacOS-post-install` @ `26b0a91`) matches **A** for ECC artifacts (166-line skill, 763-line instincts).

---

## Artifact comparison matrix

### `SKILL.md` (`.claude/skills/AlphaClaw/` + `.agents/skills/AlphaClaw/`)

| Dimension | A — Integration base | B — PR #30 bot | C — Wrong (`eb10e757`) | D — Correct synthesis |
|-----------|---------------------|----------------|------------------------|----------------------|
| **Lines** | 166 | 290 | 290 | 287 |
| **YAML frontmatter** | No | Yes | Yes (from B) | Yes (from B) |
| **Format bug** | Wrapped in ` ```markdown ` fence | Clean | Clean | **Fixed** — fence removed |
| **Tech stack section** | No | Yes | Yes | Yes |
| **Commit examples (from git)** | No | Yes (100 commits) | Yes | Yes |
| **Architecture / code-style tables** | No | Yes | Yes | Yes |
| **Testing & error-handling patterns** | Brief | Detailed | Detailed | Detailed + fork paths |
| **AlphaClaw operational workflows** | **6 workflows** (`/merge-upstream`, `/platform-support`, `/fix-tests`, `/add-lesson`, `/ci-update`, `/feature`) | Generic ECC workflows only | **Lost** — B only | **Preserved** from A |
| **Commands table** | Yes | No | No | **Yes** — from A |
| **Best practices Do/Don't** | No | Yes | Yes | Yes + fork notes |

**Synergy in D:** PR #30’s analytical structure + integration base’s fork-specific operator commands.

---

### `AlphaClaw-instincts.yaml`

| Dimension | A — Integration base | B — PR #30 bot | C — Wrong | D — Correct synthesis |
|-----------|---------------------|----------------|-----------|----------------------|
| **Lines** | 763 | 259 | 259 | 764 |
| **Instinct count (`id:`)** | **36** | 12 | 12 | **36** |
| **Commit evidence** | 86 commits analyzed | 100 commits analyzed | 100 | **100** (updated on shared IDs) |
| **Fork workflow instincts** | **24 unique** | 0 | **0 — deleted** | **24 preserved** |

#### Instincts lost by C (preserved in D)

PR #30 and `eb10e757` dropped these **24 integration-base-only** instincts:

| ID | Domain |
|----|--------|
| `AlphaClaw-workflow-feature-development-with-tests-and-docs` | workflow |
| `AlphaClaw-workflow-merge-upstream-and-resolve-conflicts` | workflow |
| `AlphaClaw-workflow-platform-specific-support-and-testing` | workflow |
| `AlphaClaw-workflow-test-failure-triage-and-fix` | workflow |
| `AlphaClaw-workflow-documentation-knowledge-system-update` | workflow |
| `AlphaClaw-workflow-ci-config-and-cross-platform-test-matrix-update` | workflow |
| `alphaclaw-instinct-file-naming` | code-style |
| `alphaclaw-instinct-function-naming` | code-style |
| `alphaclaw-instinct-class-naming` | code-style |
| `alphaclaw-instinct-constant-naming` | code-style |
| `alphaclaw-instinct-relative-imports` | code-style |
| `alphaclaw-instinct-named-exports` | code-style |
| `alphaclaw-instinct-vitest-pattern` | testing |
| `alphaclaw-instinct-test-types` | testing |
| `alphaclaw-instinct-test-coverage` | testing |
| `alphaclaw-instinct-try-catch-errors` | code-style |
| `alphaclaw-instinct-conventional-commits` | git |
| `alphaclaw-instinct-commit-length` | git |
| `alphaclaw-instinct-feature-dev-workflow` | workflow |
| `alphaclaw-instinct-merge-upstream-workflow` | workflow |
| `alphaclaw-instinct-platform-support-workflow` | workflow |
| `alphaclaw-instinct-test-triage-workflow` | workflow |
| `alphaclaw-instinct-docs-knowledge-update-workflow` | workflow |
| `alphaclaw-instinct-ci-matrix-update-workflow` | workflow |

The 12 instincts shared between A and B were **updated** in D with PR #30’s newer 100-commit evidence where applicable.

---

### `ecc-tools.json`

| Dimension | A — Integration base | B — PR #30 bot | C — Wrong | D — Correct synthesis |
|-----------|---------------------|----------------|-----------|----------------------|
| `referenceSetReadiness.score` | 14 | **29** | 29 | **29** (from B) |
| `profiles.requested` | **full** | security | security | **full** (from A) |
| `requestedRootPackages` | 6 packs | 3 packs | 3 packs | **6 packs** (union) |

**Package union in D:**

- `runtime-core`, `workflow-pack`, `agentshield-pack` — both A and B
- `research-pack`, `team-config-sync`, `enterprise-controls` — **A only**; restored in D

---

### `identity.json`

| Dimension | A | B / C | D |
|-----------|---|-------|---|
| `createdAt` | 2026-06-24 | 2026-08-06 | 2026-08-07 (synthesis) |
| `suggestedBy` | ecc-tools-repo-analysis | ecc-tools-repo-analysis | ecc-tools-repo-analysis **(synthesized with integration-base)** |

---

## Integration-base assets NOT in PR #30 scope (must not be deleted)

These exist on `feature/MacOS-post-install` and were **absent from PR #30’s file list** but **deleted** when PR #30’s stale `main`-based branch was compared or merged wholesale:

| Path | Purpose |
|------|---------|
| `.claude/skills/cherry-pick-down/SKILL.md` | Fork cherry-pick workflow |
| `.claude/skills/macos-port-status/SKILL.md` | macOS port tracking |
| `.claude/agents/upstream-compat-reviewer.md` | Upstream compatibility review agent |
| `.claude/hooks/check-gstack.sh` | gstack hook |
| `.claude/settings.json` | Claude settings |
| `.claude/settings.local.json` | Local overrides |

**Harmonization rule:** ECC PRs touch only managed ECC paths. Never replay a stale-base branch that deletes fork infrastructure.

---

## What `eb10e757` did (wrong)

```
Merge: 542fdf7 (integration base) + 61ff663 (PR #30 bot)
Result: 522 insertions, 799 deletions across 5 files
```

| File | Δ lines | Effect |
|------|---------|--------|
| `SKILL.md` (×2) | +378/−? | Replaced A with B; lost 6 operational workflows |
| `instincts.yaml` | **−510** | 36 → 12 instincts |
| `ecc-tools.json` | −53 | Dropped full profile packs |
| `identity.json` | timestamp only | — |

**Diagnosis:** Merge resolved conflicts by **choosing PR #30 wholesale** instead of union. The commit message claimed harmonization; the diff proves replacement.

---

## Correct synthesis algorithm (D)

Applied on `feature/MacOS-post-install` + ECC-managed paths only:

1. **SKILL.md** — Start from B’s structure; graft A’s operational workflows + commands table; remove ` ```markdown ` wrapper; add AlphaClaw-specific paths (`lib/platform.js`, `AGENTS.md`, Express 4 note).
2. **instincts.yaml** — Start from A (all 36); update shared evidence strings to B’s 100-commit analysis; update header to synthesis provenance.
3. **ecc-tools.json** — Union `requestedRootPackages` and component lists; keep A’s `full` profile; adopt B’s `referenceSetReadiness` score and `generatedAt`.
4. **identity.json** — Provenance note only.
5. **Do not touch** non-ECC paths (cherry-pick-down, macos-port-status, scripts/git/, etc.).

**Diff vs integration (D only):** 5 files, +467/−220 — additive synthesis, not 31k-line repo deletion.

---

## PR #30 branch hygiene

### Problem

PR #30’s GitHub base is `feature/MacOS-post-install`, but its git history was rooted in **stale `main`** (`852b8e38` era). A naive merge would delete ~31,566 lines including docs, tests, platform code, and git guards.

### Fix (2026-08-07)

PR #30 branch `ecc-tools/AlphaClaw-1785989223295` was **rebased onto `feature/MacOS-post-install`** with:

- Synthesized ECC artifacts (version D)
- This report (`docs/plans/2026-08-07-ecc-bundle-harmonization-report.md`)
- **No** non-ECC file changes

Draft PR #31 (`cursor/ecc-harmonize-pr30-f559`) is **superseded** by the updated PR #30.

---

## Council checklist (before merge)

- [ ] PR diff touches **only** ECC-managed paths + this report
- [ ] `SKILL.md` contains both PR #30 structure **and** 6 operational workflows
- [ ] `instincts.yaml` has **36** instincts (not 12)
- [ ] `ecc-tools.json` lists **6** root packages (includes research/team/enterprise)
- [ ] `cherry-pick-down`, `macos-port-status`, `upstream-compat-reviewer` still present on target branch
- [ ] Do **not** merge `eb10e757` replay onto integration branches

---

## References

| Item | URL |
|------|-----|
| PR #30 (ECC bundle) | https://github.com/diazMelgarejo/AlphaClaw/pull/30 |
| Wrong merge commit | https://github.com/diazMelgarejo/AlphaClaw/commit/eb10e757580ed9f274371aacbc25cace94d602d7 |
| Integration branch | `feature/MacOS-post-install` |
| oramasys-method integrative merge | orama-system `bin/orama-system/skills/oramasys-method/references/integrative-merge.md` |

---

*Append-only historical record. Update status fields additively; do not truncate prior analysis.*
