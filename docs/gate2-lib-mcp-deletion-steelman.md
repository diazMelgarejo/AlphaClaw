# Gate 2 — `lib/mcp` + `lib/agents` deletion: steelman + elegant migration

> Date: 2026-05-31 · Branch: `feature/MacOS-post-install` · Status: planned, gated on authenticated smoke-test

## What is being deleted

The original Gate-0 **JavaScript** MCP server + local-agent code in AlphaClaw:

- `lib/mcp/alphaclaw-mcp.js` — 11-tool JS MCP server
- `lib/agents/local-agent-client.js` — Ollama + LM Studio client
- `lib/agents/orchestrator.js` — Claude-planner / local-worker pattern
- `tests/server/local-agent-client.test.js` — orphan test for the above

These were copied to Perpetua-Tools and superseded by the canonical **TypeScript**
server `packages/alphaclaw-mcp` (14 tools, v0.9.16.9), which absorbed all 11 JS
tools plus 3 TS-only additions. Per `Perpetua-Tools/docs/MIGRATION.md` Gate 2,
AlphaClaw's copies are "tagged for removal after Gate 2 green."

## Steelman — is deletion the most elegant solution? (orama-system standards)

Alternatives weighed:

1. **Keep both (status quo)** — REJECTED. Duplicate MCP servers drift; violates DRY;
   doubles maintenance for zero benefit.
2. **Replace `lib/mcp/alphaclaw-mcp.js` with a thin re-export/shim → PT** — REJECTED.
   The three-repo contract is L1(AlphaClaw) ← L2(PT) ← L3(orama); AlphaClaw must
   never depend on PT. A shim inverts the dependency. Explicit-over-clever also
   favors removal over an indirection layer.
3. **Delete + repoint/remove the `.mcp.json` entry** — ACCEPTED. AlphaClaw stops
   shipping a duplicate MCP server; the canonical lives in PT (L2 middleware), the
   correct owner of the adapter + MCP surface. Single source of truth.

**Verdict:** option 3 is the elegant solution — it honors the layering, removes
duplication, and leaves one canonical MCP server.

## Safety evidence (verified 2026-05-31)

- **No external importers:** `grep` finds nothing in AlphaClaw requiring `lib/mcp`
  or `lib/agents` except `lib/mcp/alphaclaw-mcp.js` → `../agents/orchestrator`
  (both inside the deletion set).
- **`.mcp.json:10`** registers `lib/mcp/alphaclaw-mcp.js` → must be removed (or
  repointed) or it dangles after deletion.
- **`tests/server/local-agent-client.test.js`** references the deleted code → remove
  (copy already lives in PT `packages/local-agents/tests/`).
- **Parity:** PT `packages/alphaclaw-mcp` = 14 tools ⊇ the 11 JS tools (MIGRATION.md Gate 2).

## Elegant deletion steps (run only after the gate below passes)

1. `git rm lib/mcp/alphaclaw-mcp.js lib/agents/local-agent-client.js lib/agents/orchestrator.js`
2. `git rm tests/server/local-agent-client.test.js`
3. Update `.mcp.json`: remove the `alphaclaw` MCP server entry that points at the
   deleted JS file (the canonical server is registered from PT, not AlphaClaw).
   `lib/mcp/` is fork-only content, so this never reaches `pr-4-macos`/upstream.
4. Verify: `npm test` green (no broken imports), `npm run build:ui` green.
5. Commit on `feature/MacOS-post-install` only — never `pr-4-macos`.

## Gate (must pass before step 1)

A **live, authenticated** AlphaClaw smoke-test (PT adapter smoke-test against a
running server using the real `SETUP_PASSWORD`) must confirm the canonical
adapter/MCP surface works end-to-end. Build + transport were proven green on
2026-05-31; the authenticated run is the final gate.
