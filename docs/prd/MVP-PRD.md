# omp-switch MVP 产品需求文档

> **版本**: V0.1.1 | **状态**: 已发布

---

## 马斯克评分历史

- **Round 1: 6/10** — MVP 臃肿（44 条用户故事）、缺少差异化、没有北极星指标
- **Round 2: 7.5/10** — 实现细节喧宾夺主、缺少交互流程、没有异常场景
- **Round 3: 8.5/10** — 计划太远、加密密钥安全隐患未标 P0、可更简洁

---

## 1. 为什么做这件事

### 第一性原理

AI 开发者用 Claude Code / oh-my-pi 时，改 Provider 配置要手动编辑 YAML。YAML 容易写错，API Key 明文暴露，切换 Provider 要改文件 + 重启 CLI。

**差异点**：cc-switch 大而全（7 个工具、15MB+），omp-switch 只做 **oh-my-pi 的 Provider 管理**（小而快，< 12MB）。

**成功标准**：
- 启动 < 1.5s
- 包体积 < 12MB
- Provider 添加到生效 < 10s

---

## 2. 用户交互流程

### 2.1 添加 Provider

1. 打开应用 → Dashboard 显示 Provider 卡片列表
2. 点击左侧"添加 Provider"
3. 选择预设模板（OpenAI / Anthropic / Google / Ollama）或"自定义"
4. 表单自动填充预设值（ID、Name、Base URL、API Type）
5. 填写 API Key（password 输入框，圆点显示）
6. 点击"保存" → loading → Toast"保存成功" → 自动跳回 Dashboard
7. `~/.omp/agent/models.yml` 自动更新

**异常**：
- ID 为空 → 输入框变红，提示"不能为空"
- ID 已存在 → 提示"将覆盖原有配置" → 确认后 update
- 保存失败（SQLite 锁） → Toast"保存失败，请重试"

### 2.2 编辑 Provider

1. Dashboard 点击卡片"编辑"图标（铅笔）
2. 进入添加 Provider 页面，表单预填充当前值
3. 修改 API Key 或 Base URL
4. 点击"保存" → Toast"更新成功" → 跳回 Dashboard

**异常**：
- Base URL 格式非法 → 失去焦点时输入框变红
- 清空 ID → 同添加时的空值校验

### 2.3 删除 Provider

1. Dashboard 点击卡片"删除"图标（垃圾桶）
2. 确认对话框："确定删除 [Name]？不可撤销"
3. 点击"确认" → 卡片消失，Toast"删除成功"
4. `models.yml` 自动更新

**异常**：
- 取消 → 无操作
- 删除的是默认 Provider → 允许删除，`settings.json` 的 default_provider 清空
- SQLite 写入失败 → 对话框不关闭，提示"删除失败"

### 2.4 设为默认

1. Dashboard 点击卡片"设为默认"按钮
2. 该卡片出现"默认"徽章，其他徽章消失
3. `settings.json` 更新 default_provider
4. 下次启动 oh-my-pi 自动使用此 Provider

**异常**：
- 设为默认的 Provider 被删除 → 徽章消失，default_provider 清空

### 2.5 修改全局设置

1. 点击左侧"设置"
2. 表单显示当前设置
3. 修改 Thinking Level 下拉框（off / minimal / low / medium / high / xhigh）
4. 点击"保存" → Toast"保存成功"
5. `settings.json` 更新

---

## 3. 界面设计

### 3.1 Dashboard

```
+--------------------------------------------------+
| omp-switch  v0.1.1                               |
| [Dashboard] [添加 Provider] [设置] [同步]        |
+--------------------------------------------------+
|                                                  |
|  Provider 管理          默认: anthropic          |
|                                                  |
|  +------------------+  +------------------+      |
|  | OpenAI           |  | Anthropic        |      |
|  | [默认]           |  | [设为默认]        |      |
|  | API: openai-...  |  | API: anthropic...|      |
|  | https://api...   |  | https://api...   |      |
|  | [编辑] [删除]    |  | [编辑] [删除]    |      |
|  +------------------+  +------------------+      |
|                                                  |
|  +------------------+                            |
|  | Ollama           |                            |
|  | [设为默认]       |                            |
|  | API: openai-... |                            |
|  | http://local...  |                            |
|  | [编辑] [删除]    |                            |
|  +------------------+                            |
|                                                  |
+--------------------------------------------------+
```

**细节**：
- 卡片按创建时间排序，默认的置顶
- 悬停时显示编辑/删除按钮，不悬停隐藏
- "设为默认"点击后立即反馈，不等待网络
- 加载中显示骨架屏，空状态显示"暂无 Provider，点击上方添加"

### 3.2 ProviderEditor（添加/编辑）

```
+--------------------------------------------------+
| 添加 Provider                                     |
|                                                  |
|  预设模板: [请选择 ▼]                             |
|            OpenAI                                |
|            Anthropic                             |
|            Google                                |
|            Ollama                                |
|            自定义                                  |
|                                                  |
|  Provider ID *  [openai          ]               |
|  显示名称 *     [OpenAI          ]               |
|  API 类型       [openai-completions ▼]         |
|  Base URL       [https://api.openai.com/v1]      |
|  API Key        [•••••••••••••••]               |
|  启用           [✓]                              |
|                                                  |
|  [保存 Provider]                                  |
+--------------------------------------------------+
```

**细节**：
- 选择预设后自动填充，用户仍可修改
- ID 失去焦点时校验：小写、无空格、非空。非法时变红
- API Key 为 password 类型，右侧有眼睛图标切换显示
- 保存按钮 loading 时禁用
- 编辑模式下标题变为"编辑 Provider [name]"，ID 只读

### 3.3 删除确认对话框

```
+--------------------------------+
|  ⚠️ 确认删除                     |
|                                |
|  确定删除 "Anthropic"？         |
|  此操作不可撤销。                |
|                                |
|  [取消]        [确认删除]       |
+--------------------------------+
```

**细节**：
- ESC 或点击"取消"关闭
- "确认删除" loading 时禁用，防止重复点击
- 失败时对话框不关闭，错误信息显示在内

---

## 4. 数据与存储

| 文件 | 路径 | 用途 |
|------|------|------|
| SQLite DB | `~/.omp/switch/omp-switch.db` | 主存储，真相源 |
| 模型配置 | `~/.omp/agent/models.yml` | oh-my-pi 读取 |
| 全局设置 | `~/.omp/agent/settings.json` | oh-my-pi 读取 |

**加密**：
- API Key 存入 SQLite 前 AES-256-GCM 加密
- **⚠️ 安全漏洞**：当前使用固定 32 字节硬编码密钥，V0.1.2 必须改为从系统 Keychain 或用户密码派生
- `models.yml` 导出时 API Key 显示为密文

---

## 5. 异常场景

| 场景 | 行为 |
|------|------|
| `models.yml` 被外部编辑为非法 YAML | 跳过回填，使用 SQLite 数据，Toast"外部配置解析失败" |
| `models.yml` 被删除 | 从 SQLite 重新导出，静默恢复 |
| SQLite DB 被删除 | 自动创建新 DB + 运行迁移 |
| SQLite DB 被锁（多实例） | 弹出"已在运行"，焦点切换到已有窗口 |
| 无 `~/.omp/` 写权限 | 弹出错误"无法创建配置目录，请检查权限" |
| API Key 解密失败（密钥变更） | 显示"[无法解密]"，用户重新填写 |

---

## 6. 非 MVP 功能

| 功能 | 不做理由 |
|------|----------|
| WebDAV 同步 | MVP 先验证单设备 |
| 自定义模型 / 模型覆盖 | 高级用户手动编辑 YAML |
| 搜索 Provider | Provider < 10 时不需要 |
| 启用/禁用 Provider | 删除即可替代 |
| 深色模式 | 视觉优化 |
| 系统托盘 | 高频操作后 |
| 自动更新 | 手动下载即可 |
| MCP 管理 | oh-my-pi 暂不支持 |

---

## 7. 近期迭代（只计划下两周）

| 版本 | 交付物 |
|------|--------|
| V0.1.2 | 编辑模式、删除确认、版本号动态读取、Toast 通知、加密密钥安全修复 |
| V0.1.3 | 表单验证（zod）、骨架屏、预设模板从 JSON 加载 |

**原则**：超过 3 天做不完的功能，砍掉或简化。两周后再计划下两周。

---

## 8. 已知问题

| 优先级 | 问题 | 目标版本 |
|--------|------|----------|
| P0 | 加密密钥硬编码（安全漏洞） | V0.1.2 |
| P0 | ProviderEditor 无编辑模式 | V0.1.2 |
| P0 | 删除 Provider 无二次确认 | V0.1.2 |
| P0 | 版本号硬编码 `v0.1.0` | V0.1.2 |
| P1 | 没有 Toast/通知系统 | V0.1.2 |
| P1 | 表单无前端验证 | V0.1.3 |
| P1 | 无加载骨架屏 | V0.1.3 |
| P2 | ProviderStore.activeProviderId 冗余 | V0.1.2 |

---

## 9. 技术债务

1. WebDAV 为空实现，V0.2.0 接入 reqwest
2. 内置预设硬编码 4 个，V0.1.3 改为 JSON 配置文件
3. `activeProviderId` 与 `AppSettings.default_provider` 冗余，V0.1.2 删除前者
