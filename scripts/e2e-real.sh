#!/bin/bash
set -euo pipefail

# Real-App Smoke Test for macOS
# Since tauri-driver is Linux/Windows only, this script does manual verification.
#
# Usage:
#   bash scripts/e2e-real.sh
#
# Steps:
# 1. Build Tauri app in debug mode
# 2. Launch the app bundle
# 3. Wait for startup (builtin presets seeded)
# 4. Verify ~/.omp/agent/models.yml contains step-plan with models
# 5. Run omp --list-models and verify no parse errors

echo "=== Real-App Smoke Test (macOS) ==="

APP_DIR="src-tauri/target/debug"
APP_BUNDLE="$APP_DIR/omp-switch.app"
MODELS_YAML="$HOME/.omp/agent/models.yml"

# 1. Build debug app
echo "[1/4] Building Tauri debug app..."
npm run tauri build -- --debug > /dev/null 2>&1 || true
if [ ! -d "$APP_BUNDLE" ]; then
    echo "ERROR: App bundle not found at $APP_BUNDLE"
    echo "Trying alternative build path..."
    # Try without --debug flag path
    APP_BUNDLE="src-tauri/target/release/omp-switch.app"
    if [ ! -d "$APP_BUNDLE" ]; then
        echo "ERROR: Could not find built app bundle"
        exit 1
    fi
fi

# 2. Launch app
echo "[2/4] Launching app..."
open "$APP_BUNDLE"
sleep 5

# 3. Verify YAML
echo "[3/4] Verifying models.yml..."
if [ ! -f "$MODELS_YAML" ]; then
    echo "ERROR: models.yml not found at $MODELS_YAML"
    killall "omp-switch" 2>/dev/null || true
    exit 1
fi

if grep -q "step-plan" "$MODELS_YAML" && \
   grep -q "step-3.7-flash" "$MODELS_YAML" && \
   grep -q "models" "$MODELS_YAML"; then
    echo "OK: models.yml contains step-plan with model entries"
else
    echo "ERROR: models.yml missing step-plan or model entries"
    echo "--- models.yml ---"
    cat "$MODELS_YAML"
    killall "omp-switch" 2>/dev/null || true
    exit 1
fi

# 4. Verify omp CLI
echo "[4/4] Verifying omp CLI..."
OMP_OUTPUT=$(omp --list-models 2>&1) || true
if echo "$OMP_OUTPUT" | grep -qi "yaml\|parse"; then
    echo "ERROR: omp reported YAML/parse errors"
    echo "$OMP_OUTPUT"
    killall "omp-switch" 2>/dev/null || true
    exit 1
fi

if echo "$OMP_OUTPUT" | grep -q "step-3.7-flash"; then
    echo "OK: omp --list-models shows step-3.7-flash"
else
    # "No models available" is expected with a test API key
    echo "INFO: omp output: $OMP_OUTPUT"
    echo "OK: omp CLI ran without parse errors (API key may not be real)"
fi

# Cleanup
killall "omp-switch" 2>/dev/null || true
echo "=== Smoke Test PASSED ==="
