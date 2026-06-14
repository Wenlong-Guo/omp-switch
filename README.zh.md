# omp-switch

[English](README.md) | [中文](README.zh.md)

> **版本**: 1.0.0 | **支持平台**: macOS / Windows / Linux

基于 **Tauri 2 + React + SQLite** 构建的跨平台 AI Provider 配置管理工具。

## 功能特性

- **Provider 管理**：添加、编辑、删除、启用、复制、测试 AI 模型 Provider（OpenAI、Anthropic、DeepSeek、Kimi、StepFun、Qwen、MiniMax 等），使用紧凑 Provider 卡片
- **预设 Provider 卡片**：通过卡片网格选择主流厂商预设，内置官方 base URL 与旗舰/flash 模型默认值，并排除 OpenCode 专属预设
- **Provider YAML 编辑器**：按 omp 实际写入的 `models.yml` 提供 YAML 预览与编辑，不做 JSON/YAML 双格式转换
- **完整模型 CRUD**：配置全部 19 个模型参数，包括 ID、名称、API 类型、reasoning、输入类型（文本/图片）、成本（input/output/cacheRead/cacheWrite）、contextWindow、maxTokens、自定义 Headers，以及完整 ModelCompat（supportsStore、supportsDeveloperRole、supportsReasoningEffort、maxTokensField、openRouterRouting、vercelGatewayRouting、extraBody）
- **模型角色**：配置 omp 职能默认模型（`default`、`smol`、`slow`、`plan`、`commit`），只允许选择已启用 Provider 的模型
- **全局设置**：Thinking Level、隐藏 Thinking 块、预算配置和其他运行偏好
- **WebDAV 同步**：支持坚果云、NextCloud 等 WebDAV 服务端，实现多端配置同步
- **文件双向同步**：SQLite 为单一数据源，自动导出 `models.yml` 和 `settings.json`，支持外部编辑器修改后自动回填
- **API Key 加密**：AES-256-GCM 加密存储敏感信息
- **离线优先**：本地 SQLite 始终可用，WebDAV 同步失败不影响日常使用

## 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) >= 20
- [Rust](https://www.rust-lang.org/) >= 1.70
- Tauri 2 系统依赖：[Tauri 前置条件](https://v2.tauri.app/start/prerequisites/)

### 开发

```bash
# 克隆仓库
git clone https://github.com/Wenlong-Guo/omp-switch.git
cd omp-switch

# 安装依赖
npm install

# 启动 Tauri 开发应用
npm run tauri dev
```

### 构建

```bash
# 构建生产版本
npm run tauri build
```

## 技术架构

```
omp-switch/
├── src/                       # React 前端 (Vite)
│   ├── pages/                 # Dashboard、ProviderEditor、ModelRoles、Settings
│   ├── stores/                # Zustand 状态管理
│   └── components/            # 可复用 UI 组件
├── src-tauri/                 # Rust 后端 (Tauri 2)
│   ├── src/commands/          # IPC 命令处理器
│   ├── src/services/          # 业务逻辑
│   └── src/database/          # SQLite DAO
├── e2e-playwright-test/       # Playwright E2E 测试（17 个用例）
│   ├── dashboard.spec.ts
│   ├── provider-crud.spec.ts
│   ├── model-config.spec.ts
│   ├── preset-selection.spec.ts
│   ├── stepfun.spec.ts
│   ├── settings.spec.ts
│   └── mocks/
└── docs/                      # 技术文档（中文）
```

## 测试

```bash
# 单元测试 (Vitest)
npm run test

# E2E 测试 (@playwright/test)
npx playwright test
```

## 下载与安装

前往 [Releases](../../releases) 页面下载对应平台的预构建二进制文件。


## 许可证

MIT
