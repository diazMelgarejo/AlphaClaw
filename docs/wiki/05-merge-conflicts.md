# 05. Merge Conflict Patterns

**TL;DR:** After any conflict resolution touching `lib/server/onboarding/index.js`, run the onboarding tests immediately. Three specific patterns have caused post-merge failures in this repo.

---

## The Three Patterns (from `99de3c0`, `ad2325f`)

### Pattern 1: Wrapper vs. Direct Call

`routes/system.js` uses a local closure `readSystemCronConfig()` that injects dependencies. After a merge, bare calls to `getSystemCronStatus()` (no args) sneak in from the upstream side.

**Symptom:** `TypeError: missing argument` or `undefined is not a function` in tests.

**Check:** After resolving conflicts in `routes/system.js`, grep for raw `getSystemCronStatus(` calls without the injected deps:

```bash
grep -n "getSystemCronStatus(" lib/server/routes/system.js
# Every call should pass { fs, openclawDir, platform } or use the closure
```

---

### Pattern 2: Read-Only Guard Placement

`ensureManagedExecDefaults` must live **inside** the `!validatedReadOnlyMode` block in `lib/server/onboarding/index.js`. Merge conflicts sometimes move it outside.

```js
// CORRECT
if (!validatedReadOnlyMode) {
  ensureManagedExecDefaults(openclawDir);   // ← inside the guard
  ensureGatewayProxyConfig(openclawDir);
}

// WRONG — mutates openclaw.json during read-only onboarding
ensureManagedExecDefaults(openclawDir);      // ← outside the guard
if (!validatedReadOnlyMode) {
  ensureGatewayProxyConfig(openclawDir);
}
```

**Symptom:** Read-only onboarding tests fail; they expect no writes to `openclaw.json`.

---

### Pattern 3: Duplicate Calls from Merge

`ensureGatewayProxyConfig` appears twice after a merge — once from each side. Only the guarded call inside `!validatedReadOnlyMode` should survive.

**Check after any conflict resolution in `onboarding/index.js`:**

```bash
grep -c "ensureGatewayProxyConfig" lib/server/onboarding/index.js
# Expected: 1
```

---

## Rule

**After any conflict resolution touching `lib/server/onboarding/index.js` or `lib/server/routes/system.js`, run these tests before pushing:**

```bash
npx vitest run tests/server/routes-onboarding.test.js tests/server/routes-system.test.js
```

Expected: all green. Do not push if either fails.

---

## The Read-Only Invariant

The read-only onboarding mode guard is a **security invariant**:

```js
if (!validatedReadOnlyMode) { ... }
```

in `lib/server/onboarding/index.js`.

This must never be weakened. It prevents unauthorized writes to `openclaw.json` during shared/read-only onboarding sessions. If you find anything that mutates shared config outside this guard, treat it as a bug.

---

## Related

- [01 — Branch Roles](01-branch-roles.md) — which branch conflicts occur on
- `CLAUDE.md` § Key Invariants
- PR commit: `99de3c0` (resolves 3 post-merge failures)
- [macOS post-install lessons](../macos-post-install-lessons.md) § Merge Conflict Lessons
