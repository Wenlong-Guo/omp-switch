---
name: release
description: 自动化发布 omp-switch。用户说"发布VX.X.X"时触发。执行版本同步、验证、提交、移动 tag、push，并持续检查 GitHub Actions；CI 失败必须定位 annotations/logs、修复、重推 tag，直到 GitHub Release 创建成功。
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

4. **确认 CI，失败必须修到成功**：
   - push tag 后查：`https://api.github.com/repos/Wenlong-Guo/omp-switch/actions/runs?event=push&branch=v1.2.3&per_page=1`
   - 若 `status != completed`，等待后继续查。
   - 若 `conclusion != success`，查 `jobs_url` 和每个失败 job 的 `check_run_url/annotations`。
   - 修复 `.github/workflows/release.yml` 或构建问题，commit + push main。
   - 移动 tag 到最新 commit：`git push origin :refs/tags/v1.2.3 && git tag -f v1.2.3 && git push origin v1.2.3`。
   - 重复直到 `conclusion: success` 且公开 release API 返回对应 tag。

5. **确认 Release 存在**：
   ```bash
   curl https://api.github.com/repos/Wenlong-Guo/omp-switch/releases/tags/v1.2.3
   ```

## 注意事项

- Tauri MSI 不支持 prerelease 标识（如 `-rc`），`tauri.conf.json` 必须纯数字。
- Release tag 可带 `v` 前缀（如 `v1.0.0-rc`），但 `tauri.conf.json` 版本仍用纯数字。
- 若用户说 rc 版本（如 `V1.0.0-rc`），`tauri.conf.json` 用 `1.0.0`，其余文件用 `1.0.0-rc`。
- 构建产物在 `src-tauri/target/release/bundle/`。
- 不要改无关文件，不要清理既有 warnings。
- 不要只看 tag；必须确认公开 Release 页/API 已出现。不要停在 draft。
- 若没有 `gh` CLI，用 GitHub REST API 查 runs/jobs/check-runs/releases。
