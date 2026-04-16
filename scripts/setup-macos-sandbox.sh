#!/usr/bin/env bash
# =============================================================================
# setup-macos-sandbox.sh — AlphaClaw macOS Sonoma (ARM64) Sandbox Setup
# =============================================================================
# Prepares a clean macOS environment for AlphaClaw live sandboxed testing.
# Run from the AlphaClaw project root: bash scripts/setup-macos-sandbox.sh
#
# What this does:
#  1. Verifies ARM64 native shell and Node.js >= 22.14.0
#  2. Fixes npm prefix for sudo-free installs
#  3. Installs dependencies (handles ENOTEMPTY race conditions)
#  4. Builds the UI (esbuild)
#  5. Runs the full test suite (440 tests + 14 watchdog tests)
#  6. Creates .env with SETUP_PASSWORD if missing
#  7. Runs runtime smoke test
# =============================================================================

set -euo pipefail

BOLD='\033[1m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'
CYAN='\033[0;36m'; RESET='\033[0m'

log()  { echo -e "\n${BOLD}${CYAN}▶ $*${RESET}"; }
ok()   { echo -e "  ${GREEN}✓${RESET} $*"; }
warn() { echo -e "  ${YELLOW}⚠${RESET}  $*"; }
err()  { echo -e "  ${RED}✗${RESET} $*"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo ""
echo "  ╔═══════════════════════════════════════════════════╗"
echo "  ║   AlphaClaw — macOS Sonoma Sandbox Setup          ║"
echo "  ║   Project: $(pwd | sed "s|$HOME|~|")$(printf '%*s' $((38 - ${#PWD} + ${#HOME})) '')║"
echo "  ╚═══════════════════════════════════════════════════╝"
echo ""

# ─── 1. Shell and architecture ────────────────────────────────────────────
log "Step 1: Shell architecture"
ARCH=$(uname -m)
OS_VER=$(sw_vers -productVersion 2>/dev/null || echo "unknown")
echo "  macOS $OS_VER | arch: $ARCH"

if [[ "$ARCH" != "arm64" ]]; then
    warn "You are in a Rosetta 2 (x64) shell."
    warn "This can cause esbuild to install the wrong binary (darwin-x64 vs darwin-arm64)."
    warn "RECOMMENDED: Open Terminal.app natively (not via Rosetta) and rerun."
    read -rp "  Continue anyway? [y/N] " CONT
    [[ "$CONT" =~ ^[Yy]$ ]] || exit 1
else
    ok "Native ARM64 shell"
fi

# ─── 2. Node.js version ───────────────────────────────────────────────────
log "Step 2: Node.js >= 22.14.0"
NODE_VER=$(node --version 2>/dev/null | sed 's/v//' || echo "")
if [[ -z "$NODE_VER" ]]; then
    err "Node.js not found. Install: brew install node@22 && brew link --overwrite node@22"
fi

MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
MINOR=$(echo "$NODE_VER" | cut -d. -f2)
PATCH=$(echo "$NODE_VER" | cut -d. -f3)

if [[ "$MAJOR" -lt 22 ]] || ([[ "$MAJOR" -eq 22 ]] && [[ "$MINOR" -lt 14 ]]); then
    err "Node.js $NODE_VER is too old — need >= 22.14.0. Run: nvm install 22 && nvm use 22"
fi
ok "Node.js v$NODE_VER"

# ─── 3. npm prefix ────────────────────────────────────────────────────────
log "Step 3: npm prefix (sudo-free installs)"
NPM_PREFIX=$(npm config get prefix)
echo "  Current prefix: $NPM_PREFIX"
if [[ "$NPM_PREFIX" == "/usr/local" || "$NPM_PREFIX" == "/usr" ]]; then
    warn "System-owned prefix detected — setting to ~/.local"
    npm config set prefix ~/.local
    mkdir -p ~/.local/bin

    if ! grep -q '/.local/bin' ~/.zshrc 2>/dev/null; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
        warn "Added ~/.local/bin to ~/.zshrc — run: source ~/.zshrc"
    fi
    ok "npm prefix changed to ~/.local"
else
    ok "npm prefix: $NPM_PREFIX"
fi

# ─── 4. ENOTEMPTY diagnostic ──────────────────────────────────────────────
log "Step 4: Check for file-locking processes on node_modules"
LOCKED=$(lsof +D ./node_modules 2>/dev/null | tail -n +2 | head -5 || true)
if [[ -n "$LOCKED" ]]; then
    warn "Processes holding handles on node_modules:"
    echo "$LOCKED"
    warn "Close your IDE's file watcher / TypeScript server before npm install"
    warn "Or use:  killall node  (kills ALL node processes)"
    read -rp "  Continue anyway? [y/N] " CONT
    [[ "$CONT" =~ ^[Yy]$ ]] || exit 1
else
    ok "No processes locking node_modules"
fi

# ─── 5. Install dependencies ──────────────────────────────────────────────
log "Step 5: npm install"
echo "  Cleaning old install to avoid ENOTEMPTY race..."

# First attempt: clean install
if rm -rf node_modules package-lock.json 2>/dev/null; then
    ok "Cleaned node_modules and package-lock.json"
fi

MAX_ATTEMPTS=3
ATTEMPT=1
while [[ $ATTEMPT -le $MAX_ATTEMPTS ]]; do
    echo "  npm install (attempt $ATTEMPT/$MAX_ATTEMPTS)..."
    if npm install 2>&1; then
        ok "npm install succeeded"
        break
    else
        ATTEMPT=$((ATTEMPT + 1))
        if [[ $ATTEMPT -le $MAX_ATTEMPTS ]]; then
            warn "npm install failed — retrying after short pause..."
            sleep 3
        else
            err "npm install failed after $MAX_ATTEMPTS attempts. Check lsof +D ./node_modules"
        fi
    fi
done

# ─── 6. Verify esbuild binary ─────────────────────────────────────────────
log "Step 6: Verify esbuild binary architecture"
ESBUILD_BIN="./node_modules/.bin/esbuild"
if [[ -x "$ESBUILD_BIN" ]]; then
    ESBUILD_ARCH=$(file "$ESBUILD_BIN" 2>/dev/null | head -1 || echo "unknown")
    echo "  $ESBUILD_ARCH"
    if echo "$ESBUILD_ARCH" | grep -q "arm64\|ARM"; then
        ok "esbuild is ARM64 native"
    elif echo "$ESBUILD_ARCH" | grep -q "x86_64\|Mach-O 64-bit.*x86"; then
        warn "esbuild is x86_64 (Rosetta) — may fail on native ARM64"
        warn "Fix: close Rosetta shell, run npm install in a native ARM64 terminal"
    fi
else
    warn "esbuild binary not found at $ESBUILD_BIN"
fi

# ─── 7. Build UI ──────────────────────────────────────────────────────────
log "Step 7: npm run build:ui"
if npm run build:ui 2>&1; then
    ok "UI build succeeded"
else
    err "UI build failed. Check esbuild arch (Step 6) and re-run npm install in ARM64 shell."
fi

# ─── 8. Run full test suite ───────────────────────────────────────────────
log "Step 8: npm test (440 tests)"
if npm test 2>&1; then
    ok "Full test suite passed"
else
    warn "Some tests failed — check output above"
fi

log "Step 8b: npm run test:watchdog (14 tests)"
if npm run test:watchdog 2>&1; then
    ok "Watchdog tests passed"
else
    warn "Watchdog tests failed — check output above"
fi

# ─── 9. Create .env if missing ───────────────────────────────────────────
log "Step 9: .env file"
ENV_FILE=".env"
if [[ ! -f "$ENV_FILE" ]]; then
    warn ".env not found — creating with default SETUP_PASSWORD"
    cat > "$ENV_FILE" << 'ENV'
# AlphaClaw local development environment
# Change SETUP_PASSWORD before exposing to any network
SETUP_PASSWORD=localdev123
ENV
    ok "Created .env with SETUP_PASSWORD=localdev123"
    warn "IMPORTANT: Change SETUP_PASSWORD before sharing or deploying"
else
    ok ".env exists"
    if ! grep -q "SETUP_PASSWORD" "$ENV_FILE"; then
        warn "SETUP_PASSWORD not set in .env — alphaclaw.js will hard-exit at line ~492"
        echo "SETUP_PASSWORD=localdev123" >> "$ENV_FILE"
        warn "Appended SETUP_PASSWORD=localdev123 to .env"
    fi
fi

# ─── 10. Runtime smoke test ──────────────────────────────────────────────
log "Step 10: Runtime smoke test"
echo "  Starting node bin/alphaclaw.js in background (10s test)..."

# Run server in background, capture PID
node bin/alphaclaw.js start &
SERVER_PID=$!
sleep 5

# Check if it's still running
if kill -0 "$SERVER_PID" 2>/dev/null; then
    ok "Server running (PID $SERVER_PID)"

    # Quick health check
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "failed")
    if [[ "$HTTP_STATUS" == "200" || "$HTTP_STATUS" == "302" || "$HTTP_STATUS" == "301" ]]; then
        ok "HTTP health check: $HTTP_STATUS (server responding)"
    else
        warn "HTTP check returned: $HTTP_STATUS (may still be starting up)"
    fi

    # Check that binary was installed to ~/.local/bin, NOT /usr/local/bin
    if [[ -x ~/.local/bin/gog ]]; then
        ok "~/.local/bin/gog installed (darwin path correct)"
    fi
    if [[ -x /usr/local/bin/gog ]]; then
        warn "gog was installed to /usr/local/bin — macOS fix not applied"
    fi

    # Stop server
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
    ok "Server stopped cleanly"
else
    warn "Server exited early — check logs above for errors"
    warn "Common causes: missing SETUP_PASSWORD, port 3000 in use"
fi

# ─── SUMMARY ─────────────────────────────────────────────────────────────
echo ""
echo "  ────────────────────────────────────────────────"
echo ""
echo "  ${BOLD}${GREEN}Sandbox setup complete!${RESET}"
echo ""
echo "  To start AlphaClaw:"
echo "    node bin/alphaclaw.js start"
echo "    open http://localhost:3000"
echo ""
echo "  To fix Xcode Claude integration:"
echo "    bash scripts/fix-xcode-claude.sh"
echo ""
echo "  To publish to npm:"
echo "    npm whoami   # must show 'diazmelgarejo'"
echo "    npm publish --access public"
echo ""
echo "  ────────────────────────────────────────────────"
