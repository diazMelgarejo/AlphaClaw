# 02. macOS Bin-Path & SIP

**TL;DR:** On macOS, SIP makes `/usr/local/bin` root-owned. AlphaClaw shims go to `~/.local/bin` on darwin. Never hardcode `/usr/local/bin`.

---

## Root Cause

macOS System Integrity Protection (SIP) makes `/usr/local/bin` owned by root and not writable by normal users. The original code placed git-auth shims and `gog` CLI there, causing silent `EACCES` failures on non-root installs.

---

## Fix

`lib/platform.js` — `getBinPath()` routes by platform:

```js
// darwin → ~/.local/bin (XDG user-space, writable without sudo)
// linux  → /usr/local/bin (conventional, typically writable)
const getBinPath = ({ platform, isWritable, homedir, managedBinDir } = {}) => {
  if (platform === "darwin") {
    const userBin = path.join(homedir(), ".local", "bin");
    return managedBinDir || userBin;
  }
  // linux: prefer managedBinDir, fall back to /usr/local/bin
  if (managedBinDir && isWritable(managedBinDir)) return managedBinDir;
  return "/usr/local/bin";
};
```

`bin/alphaclaw.js` wires this at startup:

```js
const { getBinPath } = require("./lib/platform");
const installBinDir = getBinPath({ platform: os.platform(), homedir: os.homedir });
```

---

## PATH Advisory

When `npm config get prefix` returns `/usr/local` or any root-owned path, AlphaClaw logs:

```
[alphaclaw] Tip: run `npm config set prefix ~/.local` for sudo-free installs
[alphaclaw] Then add: export PATH="$HOME/.local/bin:$PATH" to ~/.zshrc
```

Recommended PATH order on macOS:

```
~/.local/bin : ~/.node/bin : /opt/homebrew/bin : $PATH
```

---

## Rule

**Never write to `/usr/local/bin`, `/usr/bin`, or `/etc/` on darwin.**

Always use `getBinPath()` from `lib/platform.js`. If you need a bin path anywhere in the codebase, import that function — do not inline the path logic.

---

## Verification

```bash
# After install, confirm shims landed in user-space
ls ~/.local/bin/gog
ls ~/.local/bin/git   # the auth shim

# Confirm NOT in /usr/local/bin
ls /usr/local/bin/gog   # should 404
```

---

## Tests

```
tests/server/platform.test.js
  ✓ returns ~/.local/bin on darwin
  ✓ returns /usr/local/bin on linux when writable
  ✓ returns managedBinDir when provided and writable
  ✓ falls back to ~/.local/bin when managedBinDir is unwritable on darwin
```

---

## Related

- [04 — macOS Cron / LaunchAgent](04-cron-scheduler.md) — same SIP root-path pattern
- [02 source: `lib/platform.js`](../../lib/platform.js)
- PR commits: `3bbf43d`, `3d99697`
- [macOS post-install lessons](../macos-post-install-lessons.md) § Platform/bin-path
