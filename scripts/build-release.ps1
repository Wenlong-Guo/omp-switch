# Build Release Script for omp-switch
# Usage: .\scripts\build-release.ps1 [-Version <x.y.z>]
# Output: src-tauri/target/release/bundle/

param(
    [string]$Version = "",
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

function Write-Step([string]$msg) {
    Write-Host "`n==> $msg" -ForegroundColor Cyan
}

function Write-OK([string]$msg) {
    Write-Host "    [OK] $msg" -ForegroundColor Green
}

function Write-Err([string]$msg) {
    Write-Host "    [ERR] $msg" -ForegroundColor Red
}

# 1. Check prerequisites
Write-Step "Checking prerequisites..."

$nodeVersion = (& node --version 2>$null)
if (-not $nodeVersion) {
    Write-Err "Node.js not found. Install from https://nodejs.org/"
    exit 1
}
Write-OK "Node.js $nodeVersion"

$cargoVersion = (& cargo --version 2>$null)
if (-not $cargoVersion) {
    Write-Err "Rust/Cargo not found. Install from https://rustup.rs/"
    exit 1
}
Write-OK "Rust $cargoVersion"

# 2. Install dependencies
Write-Step "Installing npm dependencies..."
Set-Location $Root
& npm ci
Write-OK "npm dependencies installed"

# 3. Build frontend
if (-not $SkipBuild) {
    Write-Step "Building frontend..."
    & npm run build
    Write-OK "Frontend built"
}

# 4. Set version if provided
if ($Version) {
    Write-Step "Setting version to $Version..."
    $pkg = Get-Content "$Root/package.json" | ConvertFrom-Json
    $pkg.version = $Version
    $pkg | ConvertTo-Json -Depth 10 | Set-Content "$Root/package.json"

    $toml = Get-Content "$Root/src-tauri/Cargo.toml"
    $toml = $toml -replace '^version = "[^"]+"', "version = `"$Version`""
    $toml | Set-Content "$Root/src-tauri/Cargo.toml"
    Write-OK "Version bumped to $Version"
}

# 5. Build Tauri
Write-Step "Building Tauri release..."
& npm run tauri build
if ($LASTEXITCODE -ne 0) {
    Write-Err "Tauri build failed"
    exit 1
}
Write-OK "Tauri build completed"

# 6. Collect artifacts
Write-Step "Collecting artifacts..."

$bundleDir = "$Root/src-tauri/target/release/bundle"
$outDir = "$Root/dist-tauri"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$artifacts = @()

# Windows MSI
$msi = Get-ChildItem "$bundleDir/msi/*.msi" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($msi) {
    Copy-Item $msi.FullName "$outDir/" -Force
    $artifacts += $msi.Name
    Write-OK "MSI: $($msi.Name)"
}

# Windows NSIS
$nsis = Get-ChildItem "$bundleDir/nsis/*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($nsis) {
    Copy-Item $nsis.FullName "$outDir/" -Force
    $artifacts += $nsis.Name
    Write-OK "NSIS: $($nsis.Name)"
}

# 7. Summary
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Build Complete!" -ForegroundColor Green
Write-Host "  Output: $outDir" -ForegroundColor Green
Write-Host "  Artifacts:" -ForegroundColor Green
foreach ($a in $artifacts) {
    Write-Host "    - $a" -ForegroundColor Green
    $size = (Get-Item "$outDir/$a").Length
    Write-Host "      Size: $([math]::Round($size/1MB,2)) MB" -ForegroundColor Gray
}
Write-Host "========================================`n" -ForegroundColor Green

Set-Location $Root
