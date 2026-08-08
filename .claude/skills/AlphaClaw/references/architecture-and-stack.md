# Architecture and tech stack

Synthesized from integration-base ECC artifacts and [PR #30](https://github.com/diazMelgarejo/AlphaClaw/pull/30) (ECC Tools repo analysis, 2026-08-06).

## Tech stack

| Layer | Choice |
|-------|--------|
| Language | JavaScript (Node.js 22.22.3+; or supported Node 24.15+/25.9+ per `package.json` engines) |
| Server | Express 4 (setup API layer; do not assume Express 5 semantics) |
| Frontend | Preact + `htm`, esbuild bundle under `lib/public/dist/` |
| Layout | Hybrid modules (`bin/`, `lib/server/`, `lib/public/`, `lib/setup/`) |
| Tests | `tests/server/`, `tests/frontend/` — Vitest + Supertest |
| ECC bundle | `.claude/`, `.agents/skills/AlphaClaw/` — manifest `ecc-tools.json` |

## Project structure

| Area | Path | Role |
|------|------|------|
| CLI entry | `bin/alphaclaw.js` | Lifecycle commands |
| Server | `lib/server/` | Express APIs, watchdog, channel integrations, gateway proxy |
| Setup UI | `lib/public/` | Preact components; rebuild with `npm run build:ui` after source changes |
| Setup prompts | `lib/setup/` | Agent/system prompt hardening templates |
| Platform | `lib/platform.js` | OS detection and platform-specific paths |
| Tests | `tests/server/`, `tests/frontend/` | Vitest suites |

## Configuration files

- `.github/workflows/ci.yml`
- `package.json` / `package-lock.json` (or pnpm lockfile when migrated)
- `.claude/ecc-tools.json` (ECC manifest; guarded by `scripts/check-ecc-manifest.sh`)

## Implementation guidelines

- Follow existing patterns when adding new code.
- Use `readOpenclawConfig` from `lib/server/openclaw-config.js` for config reads.
- Prefer `cachedFetch` / `useCachedFetch` for setup UI backend reads.
- Decompose growing files into focused modules (routes, hooks, components).
- After upstream merges, run `bash scripts/check-ecc-manifest.sh` — ECC paths are frequently dropped during integration.
