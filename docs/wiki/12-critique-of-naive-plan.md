# 12. Critique of the Naive Plan (avoid regressions)

**TL;DR:** Anti-regression reference salvaged from the 2026-04-15 planning drafts
(`2026-04-15-xCLAUDE-{1,2,3}.md`, superseded by the current `CLAUDE.md`). It records
what an early naive macOS-port plan got wrong about *this* codebase, so future agents
don't reintroduce hallucinated assumptions. The drafts themselves are git-ignored
scratch; this is the one section worth keeping.

---

## What the improved proposal got right (absorb these)

- Apple Silicon / Rosetta 2 esbuild arch mismatch is real and important.
- `@esbuild/darwin-arm64` optional dependency is the correct fix.
- PATH priority for user-space binaries (`~/.local/bin` first).
- `lsof +D ./node_modules` as an ENOTEMPTY diagnostic is practical.

## What it got wrong (do not repeat)

1. **`apply-openclaw-patches.js` is NOT "hardware-aware."** It applies npm
   patch-package patches for WebSocket scope and gateway auth. It reads no
   hardware info and is not affected by `.env`.
2. **`SETUP_PASSWORD` is NOT an "Onboarding Barrier" to "bypass."** It is a
   mandatory security credential. The process hard-exits (bin/alphaclaw.js,
   the `SETUP_PASSWORD` gate) if missing. The right fix is to put it in `.env`,
   not to frame it as a bug.
3. **`GITHUB_TOKEN` / `GITHUB_WORKSPACE_REPO` are NOT required** to run
   `npm run build:ui` or `npm test`. They are only needed for already-onboarded
   deployments with git sync enabled.
4. **ENOTEMPTY is a concurrent-write race condition.** Spotlight is a secondary
   contributor at most. Closing file-watching processes and IDEs is the fix
   (see [build-errors-macos.md](../build-errors-macos.md) and the "run npm install
   only once" note in [docs/TODO.md](../TODO.md)).
5. **"Masoretic correction visualizations" does not exist in this codebase.**
   That was a hallucination in the original naive plan.
6. **Publishing steps must be explicit.** The naive plan never mentioned the
   actual `npm login` / `npm publish` steps, the `name`/`version` changes in
   `package.json`, or that `~/.local/bin` must be on PATH for the installed
   binary to resolve.
7. **"Amplifier Principle" / "AI-driven data orchestration" are marketing
   language** not present anywhere in the codebase or CONTRIBUTING.md. Don't
   cite them as if they were real subsystems.

---

## Provenance

- Source: `2026-04-15-xCLAUDE-1.md` § H (drafts now git-ignored, kept on disk).
- Extracted 2026-05-31 during macOS-dup cleanup ([wiki/07](07-duplicate-files.md)).
- The drafts' operational content (esbuild, bin-path, cron, sandbox, publish) is
  reorganized into the current `CLAUDE.md` §§ A–F; only this critique was unique.
