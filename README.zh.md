# omp-switch

[English](README.md) | [中文](README.zh.md)

> **版本**: 0.1.1 | **支持平台**: macOS / Windows / Linux

基于 **Tauri 2 + React + SQLite** 构建的跨平台 AI Provider 配置管理工具。

## 功能特性

- **Provider 管理**：增删改查 AI 模型 Provider（OpenAI、Anthropic、Google 等），支持内置预设模板
- **模型配置**：自定义模型定义、模型覆盖（Model Override）、成本与兼容性配置
- **全局设置**：默认 Provider、模型、Thinking Level、隐藏 Thinking 块、预算配置
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
├── src/              # React 前端 (Vite)
│   ├── pages/        # Dashboard、ProviderEditor、Settings
│   ├── stores/       # Zustand 状态管理
│   └── components/   # 可复用 UI 组件
├── src-tauri/        # Rust 后端 (Tauri 2)
│   ├── src/commands/ # IPC 命令处理器
│   ├── src/services/ # 业务逻辑
│   └── src/database/ # SQLite DAO
├── e2e/              # Playwright CLI E2E 测试
└── docs/             # 技术文档（中文）
```

## 测试

```bash
# 单元测试 (Vitest)
npm run test

# E2E 测试 (playwright-cli)
cd e2e && bash test.sh
```

## 下载与安装

前往 [Releases](../../releases) 页面下载对应平台的预构建二进制文件。

## 版本路线

| 版本   | 功能                                                     |
|--------|----------------------------------------------------------|
| V0.1.0 | 项目骨架、SQLite 数据模型、Provider CRUD               |
| V0.1.1 | 全面代码审查、204 个通过测试                           |
| V0.1.2 | 编辑模式、删除确认、Toast 通知、动态版本号、加密密钥安全修复 |
| V0.2.0 | 模型覆盖、成本配置、WebDAV 同步                          |

## 许可证

MIT
