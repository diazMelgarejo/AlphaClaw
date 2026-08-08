# Synthesis lineage

This skill merges multiple ECC generations rather than letting any single version replace the others (orama CIDF integrative merge).

## Lineage table

| Version | Commit | Instincts | SKILL lines | Notes |
|---------|--------|----------:|------------:|-------|
| v0 proto | `d038eb8` | 21 | 80 | First ECC bundle (PR #3); recovery commit pattern |
| v0b regen | `b34bf6d` | 13 | 90 | **Regression** — lost 10 v0 instincts |
| v1.1 | `16bea5e` | 36 | 166 | Full fork workflows + commands (PR #15) |
| v1.1+sec | `16392c8` | 36 | 166 | security-evidence in manifest |
| v2 harmonize | `eb10e75` | 12 | 290 | **Rejected** — dropped 24 instincts, prose-only workflows |
| v3 synthesize | `94f8a90` | 36 | 287 | Restored instincts; PR #30 structure |
| GitHub `478fe08` | — | 45 | ~400 | Pre-OSSF-1 synthesis card |
| **OSSF-1** | this file | 45 | ≤200 orchestrator | Progressive disclosure to `references/` |

## What each layer contributed

- **v0 (`d038eb8`):** recovery commit pattern, secondary file-naming examples, Vitest test-file examples.
- **v1.1 (`16bea5e`):** six fork operational workflows with inline code examples.
- **v2 (`eb10e75`):** YAML frontmatter, architecture tables, Common Workflows frequency data — **instinct drops rejected**.
- **v3 (`94f8a90`):** Tech Stack detail, Express 4 guardrail, integrative merge best practice, error-handling block.
- **Textual resynthesis:** section ordering, `CLAUDE.md` in doc list, platform-test mocking guidance, expanded synthesis criticism.

## Fixed, not preserved

- v2/v3 `pytestmark` Python reference → Vitest `// @vitest-environment node`.
- v1.1 stray ` ```markdown ` wrapper around entire SKILL.
- v2 replacement of workflow code examples with prose-only steps.
