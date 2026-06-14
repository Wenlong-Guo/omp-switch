<p align="center">
  <img src="public/logo.png" alt="OMP Switch 图标" width="120" height="120" />
</p>

<h1 align="center">OMP Switch</h1>

<p align="center">
  <strong>给 oh-my-pi / omp 使用的 AI Provider 桌面配置管理器。</strong>
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.zh.md">中文</a>
</p>

<p align="center">
  <strong>版本</strong>: V1.0.2 · <strong>支持平台</strong>: Windows / macOS / Linux
</p>

## 这是什么？

OMP Switch 是一个桌面应用，用来管理 `omp` / `oh-my-pi` 的 Provider、模型和角色配置。

你不需要手写 YAML，也不需要记各种模型参数。打开软件，选 Provider，填 API Key，配置模型角色，保存后会自动写入 `omp` 使用的配置文件。

## 下载与安装

前往 [GitHub Releases](../../releases) 下载最新版安装包。

- **Windows**：下载 `.msi` 安装包。
- **macOS**：下载 `.dmg` 安装包。
- **Linux**：下载 `.AppImage` 文件。

普通用户不需要安装 Node.js、Rust 或 Tauri 依赖。它们只在开发本项目时需要。

## 软件截图

![Provider 管理](docs/images/screenshots/dashboard.png)

![Provider 预设](docs/images/screenshots/provider-presets.png)

![模型角色](docs/images/screenshots/model-roles.png)

![设置](docs/images/screenshots/settings.png)

## 主要功能

- **Provider 管理**：添加、编辑、删除、启用、复制、测试 AI Provider。
- **Provider 预设**：内置 OpenAI、Anthropic、DeepSeek、Kimi、StepFun、Qwen、MiniMax、SiliconFlow 等常见服务商。
- **模型配置**：管理模型 ID、API 类型、reasoning、输入类型、价格、上下文窗口、maxTokens、自定义 Headers 和兼容性参数。
- **模型角色**：给 `default`、`smol`、`slow`、`plan`、`commit` 设置默认模型。
- **自动写入配置**：以 SQLite 为数据源，自动导出 `models.yml` 和 `settings.json`。
- **WebDAV 同步**：支持坚果云、Nextcloud 等 WebDAV 服务，多设备同步配置。
- **API Key 加密**：使用 AES-256-GCM 加密保存敏感信息。
- **离线优先**：本地配置始终可用，WebDAV 同步失败不影响日常使用。

## 配置写到哪里？

OMP Switch 会管理本地数据，并导出 `omp` 使用的配置文件，例如：

- `~/.omp/agent/models.yml`
- `~/.omp/agent/settings.json`

需要时你仍然可以手动查看或编辑这些生成文件。

## 开发

开发本项目需要：

- Node.js 20+
- Rust 1.77.2
- Tauri 2 系统依赖：<https://v2.tauri.app/start/prerequisites/>

```bash
git clone https://github.com/Wenlong-Guo/omp-switch.git
cd omp-switch
npm install
npm run tauri dev
```

## 构建

```bash
npm run tauri build
```

## 测试

```bash
npm run test
npm run test:pipeline
npm run test:e2e
```

## 技术架构

```text
omp-switch/
├── src/                       # React 前端 (Vite)
├── src-tauri/                 # Rust 后端 (Tauri 2)
├── e2e-playwright-test/       # Playwright E2E 测试
├── docs/                      # 文档和截图
└── scripts/                   # 构建和发布脚本
```

## 许可证

MIT
