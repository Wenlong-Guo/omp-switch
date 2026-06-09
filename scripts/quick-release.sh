#!/usr/bin/env bash
# Quick Release - Tag & Trigger CI
# Usage: bash scripts/quick-release.sh [version]

set -e

VERSION=${1:-}

if [ -z "$VERSION" ]; then
  # Auto-increment patch version from package.json
  CURRENT=$(node -p "require('./package.json').version")
  IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"
  VERSION="${MAJOR}.${MINOR}.$((PATCH + 1))"
  echo "Auto-incrementing version: $CURRENT -> $VERSION"
fi

# Strip leading 'v' if present
VERSION=${VERSION#v}

echo "==> Updating version to $VERSION..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '$VERSION';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo "==> Updating Cargo.toml..."
node -e "
const fs = require('fs');
let toml = fs.readFileSync('src-tauri/Cargo.toml', 'utf8');
toml = toml.replace(/^version = \"[^\"]+\"/m, 'version = \"$VERSION\"');
fs.writeFileSync('src-tauri/Cargo.toml', toml);
"

echo "==> Committing..."
git add package.json src-tauri/Cargo.toml
git commit -m "chore(release): v$VERSION"

echo "==> Tagging v$VERSION..."
git tag -a "v$VERSION" -m "Release v$VERSION"

echo "==> Pushing to remote..."
git push origin main "v$VERSION"

echo ""
echo "========================================"
echo "  Release triggered!"
echo "  GitHub Actions will build:"
echo "    - macOS (x86_64 + aarch64)"
echo "    - Linux (deb + rpm + AppImage)"
echo "    - Windows (msi + nsis)"
echo "========================================"
echo ""
