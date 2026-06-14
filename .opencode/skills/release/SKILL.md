---
name: release
description: 自动化发布 omp-switch。用户说"发布VX.X.X"时触发。执行版本同步、更新 RELEASE_NOTES.md、验证、提交、移动 tag、push，并持续检查 GitHub Actions；CI 失败必须定位 annotations/logs、修复、重推 tag，直到 GitHub Release 创建成功且默认不是 prerelease。
---

# Release omp-switch

## 触发

用户说 "发布V1.2.3" 或 "release V1.2.3"。

## 流程

### 1. 同步版本号

用户给的版本不带 V 前缀（如 `1.2.3`），同步到以下文件：

| 文件 | 字段 | 值 |
|---|---|---|
| `package.json` | `"version"` | `1.2.3` |
| `package-lock.json` | `"version"` + `packages[""].version` | `1.2.3` |
| `src-tauri/Cargo.toml` | `version` | `1.2.3` |
| `src-tauri/Cargo.lock` | `[[package]] name = "omp-switch"` 下的 `version` | `1.2.3` |
| `src-tauri/tauri.conf.json` | `"version"` | 纯数字（`1.2.3`，不用 rc/beta） |

**推荐**：用 `bash scripts/quick-release.sh 1.2.3` 自动完成以上同步 + commit + tag + push。

同步后、验证前，必须检查这些版本号完全一致：

```bash
node scripts/check-version.cjs 1.2.3 1.2.2
```

该脚本会检查权威版本文件，并全局精确搜索旧版本（含 `v`/`V` 前缀）。发现任一项目自有文件版本不一致或旧版本残留，先修复，不准继续打 tag。

### 2. 更新 Release 介绍并验证构建

发布前必须更新根目录 `RELEASE_NOTES.md`，写清本次版本所有用户可见改动、修复、验证命令。GitHub Release 介绍必须来自该文件，不能留空，不能只写 tag。

```bash
npm run build          # tsc && vite build
cargo check --manifest-path src-tauri/Cargo.toml
```

### 3. 提交并打 tag（若未用 quick-release.sh）

```bash
git add -A
git commit -m "release: v1.2.3"
git tag v1.2.3
git push origin main
git push origin v1.2.3
```

### 4. 检查发布状态（用诊断脚本，禁止手写 curl | jq）

**必须用脚本**，不要手写 `curl | jq`——裸 API 调用在限流/空响应时容易误判。

```powershell
powershell -NoProfile -File scripts/check-release-status.ps1 -Tag v1.2.3
```

若有 GitHub PAT，传 `-Token` 避免匿名限流：

```powershell
powershell -NoProfile -File scripts/check-release-status.ps1 -Tag v1.2.3 -Token "ghp_xxx"
```

脚本输出 JSON，字段含义：

| 字段 | 含义 |
|---|---|
| `tag_exists` | tag 是否在远程存在 |
| `release_public` | `true` / `false` / `unknown_rate_limited` / `unknown_no_token` |
| `actions_status` | `success` / `failure` / `in_progress` / `not_found` / `unknown_rate_limited` / `unknown_no_token` |
| `actions_url` | Actions run 链接（如有） |
| `release_url` | Release 页面链接（如有） |
| `next_action` | 建议下一步操作 |

### 5. 根据诊断结果处理

**`actions_status = "in_progress"`**：等待后重新运行诊断脚本。

**`actions_status = "failure"`**：
1. 打开 `actions_url` 查看失败 job 的 annotations/logs
2. 修复 `.github/workflows/release.yml` 或构建问题
3. commit + push main
4. 移动 tag 到最新 commit：
   ```bash
   git push origin :refs/tags/v1.2.3 && git tag -f v1.2.3 && git push origin v1.2.3
   ```
5. 重新运行诊断脚本，重复直到 `actions_status = "success"`

**`release_public = "unknown_rate_limited"`**：
- 用 `-Token` 重试，或等待 ~1 小时后重试
- 也可打开 `https://github.com/Wenlong-Guo/omp-switch/releases/tag/v1.2.3` 人工确认

**`release_public = false` 且 `actions_status = "success"`**：
- 检查 workflow 中 `softprops/action-gh-release@v2` 是否执行成功
- 确认 `draft: false, prerelease: false, body_path: RELEASE_NOTES.md`

### 6. 最终确认

```bash
# 有 token 时用 API
curl -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/repos/Wenlong-Guo/omp-switch/releases/tags/v1.2.3

# 无 token 时用诊断脚本
powershell -NoProfile -File scripts/check-release-status.ps1 -Tag v1.2.3
```

## 注意事项

- Tauri MSI 不支持 prerelease 标识（如 `-rc`），`tauri.conf.json` 必须纯数字。
- Release tag 可带 `v` 前缀（如 `v1.0.0-rc`），但 `tauri.conf.json` 版本仍用纯数字。
- 若用户说 rc 版本（如 `V1.0.0-rc`），`tauri.conf.json` 用 `1.0.0`，其余文件用 `1.0.0-rc`。
- 构建产物在 `src-tauri/target/release/bundle/`。
- 不要改无关文件，不要清理既有 warnings。
- **Release workflow 必须创建公开稳定 Release（`draft: false, prerelease: false`）**，除非用户明确要求 prerelease；否则 API 返回 404 或用户看到预发布标记都不算完成。
- **每次发布必须更新 `RELEASE_NOTES.md`，并确保 workflow 用 `body_path: RELEASE_NOTES.md` 写入 GitHub Release 介绍。**
- **Rust toolchain 用 `stable`**（CI 与本地版本一致），避免 `cargo check` 因版本不匹配失败。
- **Release job 独立于 build matrix**，避免三平台并发抢创建同一 tag Release。
- **禁止手写 `curl | jq` 检查 API**。始终用 `scripts/check-release-status.ps1`，它内置限流检测、空值保护、HEAD 降级。
- 若没有 `gh` CLI，用 GitHub REST API 或诊断脚本查 runs/jobs/check-runs/releases。
- 不要只看 tag；必须确认公开 Release 页/API 已出现。不要停在 draft。
