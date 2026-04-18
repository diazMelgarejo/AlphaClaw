# To Do:

## Remaining macOS work (lands on feature/MacOS-post-install first)

### E.1 — Apple Silicon esbuild fix (HIGH PRIORITY)

`esbuild` ships platform-specific optional binaries. If npm was run under

Rosetta 2 (x64 shell), it installs `@esbuild/darwin-x64` and `npm run build:ui`

silently fails on a native ARM64 shell.

Fix: add to `package.json` `optionalDependencies`:

```json
"@esbuild/darwin-arm64": "0.25.x",
"@esbuild/darwin-x64":  "0.25.x"
```

(pin to the same major.minor as `esbuild` devDependency)

Alternatively, verify that `npm install` on a native ARM64 shell auto-selects
the right binary — if it does, no package.json change needed, just document the
"use native ARM64 shell" requirement.

### E.2 — npm global install without sudo on macOS

When a user runs `npm install -g @diazmelgarejo/alphaclaw` on a stock macOS,
npm defaults to `/usr/local` (root-owned). Fix: on darwin, if the npm global
prefix is not user-writable, log a one-time advisory at startup:

```js
// bin/alphaclaw.js, early darwin check (~line 130)

if (os.platform() === 'darwin') {

  try {

    const npmPrefix = execSync('npm config get prefix', { encoding: 'utf8' }).trim();

    if (npmPrefix === '/usr/local' || npmPrefix.startsWith('/usr')) {
      console.log('[alphaclaw] Tip: run `npm config set prefix ~/.local` for sudo-free installs');
      console.log('[alphaclaw] Then add: export PATH="$HOME/.local/bin:$PATH" to ~/.zshrc');
    }
  } catch {}
}
```

PATH priority on macOS:

```
~/.local/bin : ~/.node/bin : /opt/homebrew/bin : $PATH

```

### E.3 — macOS cron → user LaunchAgent

The current code writes `/etc/cron.d/openclaw-hourly-sync` which requires
root on macOS and silently fails (EACCES, caught and skipped). The pr-4-macos
cron validation fix improves the schedule parser but does not fix the write
path. Finish it:

In `bin/alphaclaw.js` cron setup block (~line 595), add darwin branching:

```js

if (os.platform() === 'darwin') {

  // Write ~/Library/LaunchAgents/com.alphaclaw.hourly-sync.plist
  const plistDir = path.join(os.homedir(), 'Library', 'LaunchAgents');
  fs.mkdirSync(plistDir, { recursive: true });

  const plistPath = path.join(plistDir, 'com.alphaclaw.hourly-sync.plist');

  const plistContent = buildHourlySyncPlist(hourlyGitSyncPath); // new helper

  fs.writeFileSync(plistPath, plistContent);
  execSync(`launchctl load -w "${plistPath}"`, { stdio: 'ignore' });
  console.log('[alphaclaw] LaunchAgent installed for hourly sync');

} else {
  // existing /etc/cron.d path (unchanged)
}

```

Create `lib/scripts/macos-hourly-sync.plist.template`:

```xml

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>

  <key>Label</key><string>com.alphaclaw.hourly-sync</string>
  <key>ProgramArguments</key>
  <array><string>@@SYNC_SCRIPT_PATH@@</string></array>
  <key>StartInterval</key><integer>3600</integer>
  <key>RunAtLoad</key><false/>
  <key>StandardOutPath</key>
  <string>@@LOG_PATH@@</string>
  <key>StandardErrorPath</key>
  <string>@@LOG_PATH@@</string>

</dict></plist>

```

### E.4 — ENOTEMPTY mitigation protocol

On macOS Sonoma, ENOTEMPTY during `npm install` is a concurrent-write race
(another process holds a handle on `node_modules`). Protocol:

```bash
# 1. Find blockers
lsof +D ./node_modules 2>/dev/null | head -20

# 2. Clean install
rm -rf node_modules package-lock.json
npm install



# 3. If still failing on rename loops, use --no-bin-links and link manually
npm install --no-bin-links
ln -sf $(pwd)/node_modules/.bin/esbuild ~/.local/bin/esbuild
```

Note: Spotlight indexing can occasionally hold handles, but is not the primary
cause. Closing IDEs and terminals that watch node_modules is more effective.

### E.5 — CI matrix for macOS

Update `.github/workflows/ci.yml`:

```yaml
strategy:

  matrix:
    os: [ubuntu-latest, macos-latest]
    node-version: [22]

runs-on: ${{ matrix.os }}

steps:
  - uses: actions/setup-node@v4

    with:
      node-version: ${{ matrix.node-version }}
```

---

## F — npm Package Preparation for Publishing

### F.1 — package.json changes (on feature/MacOS-post-install, version 0.9.6)

| Field | Before | After |
|---|---|---|
| `name` | `@chrysb/alphaclaw` | `@diazmelgarejo/alphaclaw` (npm scopes must be **lowercase**) |
| `version` | `0.9.x` | `0.9.6` (local dev version — NOT cherry-picked to pr-4-macos) |
| `repository` | `https://github.com/chrysb/alphaclaw.git` | `https://github.com/diazmelgarejo/alphaclaw` |
| `publishConfig.access` | `public` | `public` (keep) |
| `engines.node` | `>=22.14.0` | `>=22.14.0` (keep) |

**Do NOT cherry-pick the version bump to pr-4-macos.** Version on that branch
must follow upstream chrysb/alphaclaw versioning.

### F.2 — .npmrc changes

```
# Replace:
@chrysb:registry=https://registry.npmjs.org/

# With:
@diazmelgarejo:registry=https://registry.npmjs.org/
```

### F.3 — Internal string updates

- `scripts/apply-openclaw-patches.js` line 76: `[@chrysb/alphaclaw]` → `[@diazmelgarejo/alphaclaw]`
- Search: `grep -r '@chrysb/alphaclaw' lib/ bin/ scripts/`

### F.4 — npm Publishing workflow (manual steps)

```bash
# Authenticate
npm adduser          # create npmjs.com account if needed
npm login            # authenticate terminal session
npm whoami           # must print "diazmelgarejo"

# Dry run
npm pack --dry-run   # verify: bin/, lib/, patches/, scripts/apply-openclaw-patches.js

# Publish (prepack runs build:ui automatically)
npm publish --access public
```

**`~/.npmrc` auth token must NEVER be committed.**

---

## G — Verification Checklist (clean macOS Sonoma)

```bash

# Pre-requisites
node --version        # must be ≥ 22.14.0, ARM64 native (not Rosetta)
npm config get prefix # should be ~/.local, not /usr/local

# Build + test
npm install
npm run build:ui      # no ENOTEMPTY, no permission errors, no esbuild arch errors
npm test              # 440 tests green
npm run test:watchdog # 14 tests green
npm run test:coverage # coverage report generated


# Runtime smoke (requires SETUP_PASSWORD in .env)
node bin/alphaclaw.js start

# ✓ Server starts on port 3000
# ✓ No writes to /usr/local/bin, /etc/cron.d attempted
# ✓ ~/.local/bin/gog installed
# ✓ ~/Library/LaunchAgents/com.alphaclaw.hourly-sync.plist created (if onboarded)
# ✓ PATH advisory logged if npm prefix is root-owned
```

---

## H — Critique of the Previous Plans (for reference / avoid regressions)

**What the improved proposal got right (absorb these):**

- Apple Silicon / Rosetta 2 esbuild arch mismatch is real and important
- `@esbuild/darwin-arm64` optional dependency is the correct fix
- PATH priority for user-space binaries (`~/.local/bin` first)
- `lsof +D ./node_modules` as ENOTEMPTY diagnostic is practical

**What it still got wrong (do not repeat):**

1. `apply-openclaw-patches.js` is NOT "hardware-aware." It applies npm
   patch-package patches for WebSocket scope and gateway auth. It reads no
   hardware info and is not affected by `.env`.

2. SETUP_PASSWORD is NOT an "Onboarding Barrier" to "bypass." It is a
   mandatory security credential. The process hard-exits (line 503) if missing.
   The right fix is to put it in `.env`, not to frame it as a bug.

3. GITHUB_TOKEN and GITHUB_WORKSPACE_REPO are NOT required to run
   `npm run build:ui` or `npm test`. They are only needed for already-onboarded
   deployments with git sync enabled.

4. ENOTEMPTY is a concurrent-write race condition. Spotlight is a secondary
   contributor at most. Closing file-watching processes and IDEs is the fix.

5. "Amplifier Principle" and "AI-driven data orchestration" are marketing
   language not present anywhere in the codebase or CONTRIBUTING.md.

---

## I — M2 MacBook Sandbox Testing