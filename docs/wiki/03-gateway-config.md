# 03. Gateway Config Sanitization

**TL;DR:** Every provider entry in `openclaw.json` must have a `models` key. Without it, OpenClaw's JSON-schema validator crashes silently on startup — you get a blank 30-second timeout with no error log.

---

## Root Cause

OpenClaw's gateway JSON-schema validator requires every provider object to include a `models` array. When AlphaClaw generates config for self-hosted providers (Ollama, LM Studio), the `models` key is absent. The validator crashes with no user-visible error; the gateway simply never comes up, and the startup timeout fires after 30 seconds.

---

## Fix

`sanitizeOpenclawConfig()` in `lib/server/openclaw-config.js` normalizes every provider:

```js
const sanitizeOpenclawConfig = (cfg) => {
  if (!cfg || typeof cfg !== "object") return cfg;
  if (!Array.isArray(cfg.providers)) return cfg;
  cfg.providers = cfg.providers
    .filter((p) => p != null && typeof p === "object")
    .map((p) => ({
      ...p,
      models: Array.isArray(p.models) ? p.models : [],
    }));
  return cfg;
};
```

Called before any gateway spawn:

```js
// bin/alphaclaw.js — after reading openclaw.json
const config = sanitizeOpenclawConfig(readOpenclawConfig());
spawnGateway(config);
```

---

## Edge Cases Hardened (`61c8284`)

- `null` provider entries — filtered out (`.filter(p => p != null)`)
- Provider that is itself an array instead of object — type-checked (`typeof p === "object"`)
- `models` that exists but is not an array — replaced with `[]`

---

## Rule

**Call `sanitizeOpenclawConfig()` before every gateway spawn.** Do not pass raw config from disk directly to the gateway. This must never be bypassed, even in test helpers.

---

## Symptom Identification

If you see:
- Gateway process never logs "OpenClaw started" or similar
- `bin/alphaclaw.js` waits ~30 seconds then exits or retries
- No error is printed — it just hangs

Check: does `openclaw.json` have providers without `models`?

```bash
node -e "const c = require('./data/openclaw.json'); c.providers.forEach((p,i) => { if (!Array.isArray(p.models)) console.log('provider', i, 'missing models:', JSON.stringify(p)) })"
```

---

## Tests

```
tests/server/openclaw-config.test.js
  ✓ adds models: [] when key is missing
  ✓ preserves existing models array
  ✓ filters out null provider entries
  ✓ handles array-typed provider (replaces with empty object + models: [])
  ✓ returns cfg unchanged when providers is absent
```

---

## Related

- PR commits: `4d04616`, `61c8284`
- [macOS post-install lessons](../macos-post-install-lessons.md) § Gateway Config Lessons
