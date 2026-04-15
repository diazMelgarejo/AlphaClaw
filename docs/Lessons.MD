# Lessons

## Windows Development

- Use user-owned shims in `C:\Users\lab\.lmstudio\bin` instead of versioned symlinks into app install folders.
- Anchor `node` to LM Studio's bundled runtime at `C:\Users\lab\.lmstudio\.internal\utils\node.exe` and let `npm.cmd` resolve the latest compatible npm package from `C:\Users\lab\.lmstudio\tools\npm`.
- Resolve `git.exe` dynamically from GitHub Desktop so app updates do not break the shell setup.
- Verify the wiring directly with `git --version`, `node --version`, and `npm --version`.

## AlphaClaw PR Decisions

- Start the managed scheduler immediately after macOS onboarding installs the hourly sync config.
- Reject named cron tokens in the managed scheduler path because the parser only handles numeric cron fields reliably.
- Add targeted regression tests beside the affected onboarding and system routes.
- Keep process notes in a separate docs branch so the code-fix branch stays easy to review and merge.
