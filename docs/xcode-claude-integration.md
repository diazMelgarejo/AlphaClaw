# Xcode 26.3 BETA + Claude Code Integration Guide

## The Error

```bash
Error spawning Claude (on channel ht1por4zthf): Error: Claude Code returned an error result:
No conversation found with session ID: a711fb52-edd6-4017-9fa4-3f9dac2c1481
```

### Root Cause

This error happens when:

1. **`~/.claude/` directory is missing** — Claude Code CLI cannot store or retrieve sessions.
2. **Stale session ID** — Xcode or VS Code stored a session ID from a previous Claude Code run
   that no longer exists (sessions expire or are cleaned up on restart).
3. **Claude Code not found or misconfigured** — wrong PATH, binary not executable.

## Quick Fix

Open Terminal (native ARM64, NOT Rosetta) and run from the AlphaClaw directory:

```bash
bash scripts/fix-xcode-claude.sh
```

This script will:

- Create `~/.claude/` directory
- Clear stale session IDs from Xcode and VS Code config
- Register `xcrun mcpbridge` as a Claude Code MCP server
- Create Xcode CodingAssistant config
- Verify Claude Code CLI path and spawn

After running, **restart Xcode completely** (Cmd+Q, then reopen).

---

## Manual Setup (if script fails)

### 1. Create ~/.claude/ directory

```bash
mkdir -p ~/.claude
cat > ~/.claude/settings.json << 'EOF'
{
  "autoUpdaterStatus": "enabled",
  "hasCompletedOnboarding": true,
  "lastSeenChangelog": "1.0.0"
}
EOF
```

### 2. Register xcrun mcpbridge

First enable in Xcode:

- **Xcode → Settings → Intelligence**
- Turn on **"Model Context Protocol → Xcode Tools"**

Then register in Claude Code CLI:

```bash
claude mcp add --transport stdio xcode -- xcrun mcpbridge
claude mcp list  # should show "xcode" server
```

### 3. Clear stale sessions (VS Code)

```bash
VS_CODE_CLAUDE="$HOME/Library/Application Support/Code/User/globalStorage/anthropic.claude-code"
# Back up first
cp -r "$VS_CODE_CLAUDE" "${VS_CODE_CLAUDE}.bak" 2>/dev/null || true
# Delete session storage (VS Code will recreate)
find "$VS_CODE_CLAUDE" -name "workspaceStorage" -type d | xargs rm -rf 2>/dev/null || true
```

### 4. Xcode CodingAssistant config

```bash
mkdir -p ~/Library/Developer/Xcode/CodingAssistant/ClaudeAgentConfig
cat > ~/Library/Developer/Xcode/CodingAssistant/ClaudeAgentConfig/.claude.json << 'EOF'
{
  "claudeCodePath": "/usr/local/bin/claude",
  "preferredModel": "claude-sonnet-4-6",
  "enableMCP": true,
  "mcpServers": {
    "xcode": {
      "command": "xcrun",
      "args": ["mcpbridge"],
      "type": "stdio"
    }
  },
  "sessionManagement": {
    "resumeOnRestart": false,
    "clearStaleSessionsOnStart": true
  }
}
EOF
```

---

## Architecture Overview

```
Xcode 26.3 BETA
      │
      │ Intelligence panel / Predictive Code Completion
      │
      ▼
 xcrun mcpbridge  ←─── MCP protocol ───→  Claude Code CLI (~/.claude/)
      │                                         │
      │                                    Sessions DB
      │                                    ~/.claude/sessions/
      ▼
 Xcode Tools MCP (file system, build, launchctl)
```

```
VS Code
      │
      │ Claude Code extension (anthropic.claude-code)
      ▼
 Claude Code CLI
      │
      ├─ MCP server: xcode (xcrun mcpbridge)
      └─ Sessions: ~/.claude/sessions/
```

---

## Project-Level MCP Config (.mcp.json)

The `.mcp.json` at the project root tells Claude Code which MCP servers to activate
when working in this project:

```json
{
  "mcpServers": {
    "xcode": {
      "command": "xcrun",
      "args": ["mcpbridge"],
      "type": "stdio"
    }
  }
}
```

Claude Code reads this automatically when you `cd` into the AlphaClaw directory.

---

## Xcode Intelligence Settings

1. Open **Xcode → Settings** (Cmd+,)
2. Click **Intelligence** tab
3. Under **Model Context Protocol**:
   - Turn on **"Xcode Tools"** → enables `xcrun mcpbridge`
4. Under **Code Completion**:
   - Enable **"Predictive Code Completion"** for Claude-powered completions
5. Click the **Claude** icon in the toolbar to open the AI panel

**Important operational notes:**

- Xcode must have a project or folder open for `mcpbridge` to be active
- A dialog "Allow [agent] to access Xcode?" appears for each new agent PID — click Allow
- Xcode creates a restricted shell that does NOT inherit `~/.zshrc` — use absolute paths

---

## Troubleshooting

### Error: "No conversation found with session ID: ..."

Run `bash scripts/fix-xcode-claude.sh` — this clears the stale ID.

### Error: "Claude Code CLI not found"

```bash
which claude  # should show /usr/local/bin/claude or ~/.local/bin/claude
# If not found:
export PATH="$HOME/.local/bin:$PATH"
# Or reinstall Claude Code from https://claude.ai/download
```

### Error: "xcrun mcpbridge not found"

Requires Xcode 26.3+. Enable via:
Xcode → Settings → Intelligence → Model Context Protocol → Xcode Tools: ON

### esbuild arch mismatch on ARM64

```bash
uname -m  # must be arm64, not x86_64
# If x86_64, open a new native Terminal and:
rm -rf node_modules package-lock.json
npm install
```

### ENOTEMPTY during npm install

```bash
lsof +D ./node_modules | head -20  # find file-locking processes
# Close IDE file watchers, then:
rm -rf node_modules package-lock.json && npm install
```

---

## macOS-Specific Invariants (Never Violate)

| What to NEVER do | What to do instead |
|---|---|
| Write to `/usr/local/bin/` on darwin | Write to `~/.local/bin/` (via `lib/platform.js`) |
| Write to `/etc/cron.d/` on darwin | Use `~/Library/LaunchAgents/*.plist` |
| Run as root for binary installs | Set `npm config set prefix ~/.local` |
| Resume stale Claude sessions | Let Claude Code create a new session |

See `docs/plans/macos-port-canonical.md` for the full implementation plan.
