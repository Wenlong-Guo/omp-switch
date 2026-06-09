# Build Scripts

## Quick Release (Recommended)

One command to version bump, tag, and trigger CI builds for all platforms:

```bash
# Auto-increment patch version (0.1.2 -> 0.1.3)
bash scripts/quick-release.sh

# Or specify version explicitly
bash scripts/quick-release.sh 0.2.0
```

This will:
1. Update `package.json` and `src-tauri/Cargo.toml` version
2. Commit the changes
3. Create Git tag
4. Push to trigger `.github/workflows/release.yml`

GitHub Actions will then build on 3 runners in parallel:
- **macOS** (Intel + Apple Silicon) -> `.dmg`
- **Linux** (x86_64) -> `.deb`, `.rpm`, `.AppImage`
- **Windows** (x86_64) -> `.msi`, `.exe`

## Local Windows Build

```powershell
# Full release build with version bump
.\scripts\build-release.ps1 -Version 0.1.2

# Skip frontend build (if already built)
.\scripts\build-release.ps1 -SkipBuild
```

Output: `dist-tauri/` directory with installer files.

## Manual Multi-Platform

If you have all 3 OS machines:

```bash
# macOS
npm run tauri build -- --target x86_64-apple-darwin
npm run tauri build -- --target aarch64-apple-darwin

# Linux
npm run tauri build -- --target x86_64-unknown-linux-gnu

# Windows
npm run tauri build -- --target x86_64-pc-windows-msvc
```

## Requirements

- Node.js >= 20
- Rust >= 1.77.2
- For Linux builds: `libgtk-3-dev`, `libwebkit2gtk-4.1-dev`

## CI/CD Details

The `.github/workflows/release.yml` workflow:
- Triggers on git tags `v*` or manual dispatch
- Runs 3 parallel jobs on GitHub-hosted runners
- Creates GitHub Release with all artifacts attached
- No self-hosted runners needed
