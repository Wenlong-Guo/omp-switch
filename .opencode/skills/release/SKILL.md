---
name: release
description: 自动化发布 omp-switch。用户说"发布VX.X.X"时触发。执行：同步版本号到 package.json/package-lock.json/Cargo.toml/Cargo.lock/tauri.conf.json（tauri.conf 用纯数字版因 MSI 限制），git add -A + commit，tag vX.X.X，push main + push tag，GitHub Actions 自动三平台构建 draft prerelease。
---

# Release omp-switch

## 触发

用户说 "发布V1.2.3" 或 "release V1.2.3"。

## 流程

1. **同步版本号**（用户给的版本不带 V 前缀，如 `1.2.3`）：
   - `package.json`: `"version": "1.2.3"`
   - `package-lock.json`: `"version": "1.2.3"`（两处）
   - `src-tauri/Cargo.toml`: `version = "1.2.3"`
   - `src-tauri/Cargo.lock`: `version = "1.2.3"`（Cargo.toml 对应条目）
   - `src-tauri/tauri.conf.json`: `"version": "1.2.3"`（纯数字，不用 rc/beta 等 prerelease 标识，因为 Windows MSI 不支持）

2. **验证构建**：
   ```bash
   npm run build          # tsc && vite build
   cargo check --manifest-path src-tauri/Cargo.toml
   ```

3. **提交并打 tag**：
   ```bash
   git add -A
   git commit -m "release: v1.2.3"
   git tag v1.2.3
   git push origin main
   git push origin v1.2.3
   ```

4. **确认 CI**：push tag 后 `.github/workflows/release.yml` 自动触发三平台构建（macOS/Windows/Linux），创建 draft prerelease。去 `https://github.com/Wenlong-Guo/omp-switch/actions` 确认。

## 注意事项

- Tauri MSI 不支持 prerelease 标识（如 `-rc`），`tauri.conf.json` 必须纯数字。
- Release tag 可带 `v` 前缀（如 `v1.0.0-rc`），但 `tauri.conf.json` 版本仍用纯数字。
- 若用户说 rc 版本（如 `V1.0.0-rc`），`tauri.conf.json` 用 `1.0.0`，其余文件用 `1.0.0-rc`。
- 构建产物在 `src-tauri/target/release/bundle/`。
- 不要改无关文件，不要清理既有 warnings。
