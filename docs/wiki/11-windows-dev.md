# 11. Windows Development Environment

**TL;DR:** Anchor dev tools to user-owned stable paths (LM Studio bin, GitHub Desktop git) — not versioned install folders that break when apps update.

---

http://192.168.9.238:1234	qwen3.5-27b-claude-4.6-opus-reasoning-distilled-v2
http://192.168.8.153:1234	gemma-4-26b-a4b-it-nvfp4

---

http://192.168.9.238:1234\tqwen3.5-27b-claude-4.6-opus-reasoning-distilled-v2
http://192.168.8.153:1234\tgemma-4-26b-a4b-it-nvfp4

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
