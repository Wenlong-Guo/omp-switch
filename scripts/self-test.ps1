# Self-Test Script for omp-switch Desktop App (Windows)
# Usage: .\scripts\self-test.ps1
# Steps: Test -> Build -> Launch -> Verify

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Write-Step([string]$msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-OK([string]$msg) { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "    [WARN] $msg" -ForegroundColor Yellow }

# ==========================================
# STEP 1: Automated Tests
# ==========================================
Write-Step "STEP 1: Running automated tests..."

& npm run test 2>&1 | Select-Object -Last 5
if ($LASTEXITCODE -ne 0) {
    Write-Warn "Unit tests failed. Continue anyway? (y/n)"
    $r = Read-Host
    if ($r -ne 'y') { exit 1 }
} else {
    Write-OK "Unit tests passed"
}

& npx playwright test --reporter=line 2>&1 | Select-Object -Last 3
if ($LASTEXITCODE -ne 0) {
    Write-Warn "E2E tests failed. Continue anyway? (y/n)"
    $r = Read-Host
    if ($r -ne 'y') { exit 1 }
} else {
    Write-OK "E2E tests passed"
}

# ==========================================
# STEP 2: Build Tauri Release
# ==========================================
Write-Step "STEP 2: Building Tauri release..."

if (-not (Test-Path "$Root/src-tauri/target/release/omp-switch.exe")) {
    Write-Host "    Building (this takes 2-5 mins on first run)..." -ForegroundColor Gray
    & npm run tauri build 2>&1 | Select-Object -Last 10
    if ($LASTEXITCODE -ne 0) {
        Write-Host "    Build failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-OK "Using existing build"
}

# ==========================================
# STEP 3: Launch App
# ==========================================
Write-Step "STEP 3: Launching desktop app..."

$exePath = "$Root/src-tauri/target/release/omp-switch.exe"
if (-not (Test-Path $exePath)) {
    Write-Host "    EXE not found at $exePath" -ForegroundColor Red
    exit 1
}

$proc = Start-Process $exePath -PassThru
Write-OK "App launched (PID: $($proc.Id))"
Start-Sleep -Seconds 3

# ==========================================
# STEP 4: Manual Verification Checklist
# ==========================================
Write-Step "STEP 4: Manual Verification Checklist"
Write-Host "`n请逐项测试，按 Enter 确认每项通过..." -ForegroundColor Yellow

$checks = @(
    "窗口标题显示 'omp-switch'，无报错弹窗",
    "左侧导航栏可见: Dashboard / 设置 / 同步",
    "Dashboard: 显示 Provider 卡片列表（默认 OpenAI/Anthropic/StepFun）",
    "Dashboard: 搜索框输入 'openai'，卡片正确过滤",
    "Provider 添加: 点击 '添加 Provider' -> 填写 ID/name/API 类型 -> 保存成功弹 Toast",
    "Provider 编辑: 点击卡片 '编辑' -> 修改名称 -> 保存 -> 列表刷新",
    "Provider 删除: 点击 '删除' -> 确认对话框出现 -> ESC 关闭 / 确认删除",
    "模型配置: 编辑 Provider -> 点击 '添加模型' -> 填写 model ID/name -> 保存",
    "设置页面: 切换 Thinking Level -> 保存成功",
    "同步页面: 输入 WebDAV URL/账号/密码 -> 点击 '测试连接'",
    "导入导出: Dashboard 点击 '导出 JSON' -> 下载文件成功",
    "关闭应用: 右上角 X 关闭 -> 进程正常退出"
)

$passed = 0
$failed = 0

for ($i = 0; $i -lt $checks.Length; $i++) {
    $n = $i + 1
    $item = $checks[$i]
    Write-Host "`n[$n/$($checks.Length)] $item" -ForegroundColor Cyan
    Write-Host "    按 Enter = 通过 | 输入 n = 不通过 | 输入 s = 跳过" -ForegroundColor Gray
    $resp = Read-Host "    Result"
    switch ($resp) {
        'n' { $failed++; Write-Host "    [FAIL] $item" -ForegroundColor Red }
        's' { Write-Host "    [SKIP] $item" -ForegroundColor Yellow }
        default { $passed++; Write-Host "    [PASS] $item" -ForegroundColor Green }
    }
}

# ==========================================
# STEP 5: Cleanup & Summary
# ==========================================
Write-Step "STEP 5: Cleanup"

if ($proc -and -not $proc.HasExited) {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    Write-OK "App process stopped"
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Self-Test Complete" -ForegroundColor Green
Write-Host "  Passed: $passed / $($checks.Length)" -ForegroundColor Green
Write-Host "  Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { 'Red' } else { 'Green' })
Write-Host "========================================`n" -ForegroundColor Green

if ($failed -gt 0) {
    Write-Host "有 $failed 项未通过，请检查对应功能。" -ForegroundColor Red
    exit 1
} else {
    Write-Host "全部通过！可以打包发布。" -ForegroundColor Green
    exit 0
}
