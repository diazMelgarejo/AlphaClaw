# 11. Windows Development Environment

**TL;DR:** Anchor dev tools to user-owned stable paths (LM Studio bin, GitHub Desktop git) — not versioned install folders that break when apps update.

---

## LM Studio endpoints (Windows GPU nodes)

Each Windows GPU node serves LM Studio on port 1234. Addresses come from DHCP,
so never write them in tracked files. Set them once in `.env.local`
(`LM_STUDIO_WIN_ENDPOINTS=http://<node-1>:1234,http://<node-2>:1234`) or let
discovery write `~/.openclaw/state/last_discovery.json`.

| Node | GPU | LM Studio model IDs |
| ---- | --- | ------------------- |
| `win-rtx3080` | RTX 3080, 10 GB | `qwen3.5-27b-claude-4.6-opus-reasoning-distilled-v2`, `gemma-4-26b-a4b-it` (Q4_K_M), `qwen/qwen3.8-27b` (benchmark pending) |
| `win-rtx5080` | RTX 5080, 16 GB | `gemma-4-26b-a4b-it-nvfp4`, `qwen/qwen3.8-27b` (benchmark pending), `diffusiongemma-26b-a4b-it-nvfp4` (text-to-image; benchmark later) |

Model placement, offload and benchmarks live in Perpetua-Tools
[`config/models.yml`](https://github.com/diazMelgarejo/Perpetua-Tools/blob/main/config/models.yml)
and [`hardware/SKILL.md`](https://github.com/diazMelgarejo/Perpetua-Tools/blob/main/hardware/SKILL.md);
this table only names what each node serves.

---

## Launcher Setup (lab machine)

### Node / npm

- **Node:** `C:\Users\lab\.lmstudio\.internal\utils\node.exe` — LM Studio's bundled runtime
- **npm:** resolves from `C:\Users\lab\.lmstudio\tools\npm` — latest compatible version
- Shims go in `C:\Users\lab\.lmstudio\bin` — **not** versioned symlinks into app install folders (those break when LM Studio updates)

### git

- Resolve `git.exe` dynamically from GitHub Desktop — do not hardcode a versioned path like `C:\Users\lab\AppData\Local\GitHubDesktop\app-X.Y.Z\resources\app\git\cmd\git.exe`
- App updates change the version segment; a hardcoded path silently breaks the whole environment

### Verify the wiring

```cmd
git --version
node --version
npm --version
```

---

## Rule

**Never symlink dev tools into versioned app install folders on Windows.** Use the stable user-bin directory (`C:\Users\lab\.lmstudio\bin`) for shims and resolve versioned tool paths dynamically at runtime.

---

## Related

- [02 — macOS Bin-Path](02-macos-bin-path.md) — same principle on macOS (`~/.local/bin` vs `/usr/local/bin`)
