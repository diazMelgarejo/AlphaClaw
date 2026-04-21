
## [2026-04-21] Configuration Portability: OS-Agnostic Paths
- **Problem**: Absolute paths (e.g., /Users/user/...) in openclaw.json break cross-platform deployments (Linux/Windows/macOS).
- **Solution**: Always use ${HOME} variables in configuration templates. The AlphaClaw gateway and onboarding runtime MUST resolve these variables relative to the OS-specific home directory.
- **Action**: Enforce ${HOME} in all openclaw.json.template and active configuration files. Avoid hardcoding usernames or absolute paths.
