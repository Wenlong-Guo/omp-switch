# omp-switch

[English](README.md) | [中文](README.zh.md)

> **Version**: 0.1.2 | **Platforms**: macOS / Windows / Linux

A cross-platform AI Provider configuration manager built with **Tauri 2 + React + SQLite**.

## Features

- **Provider Management**: Add, edit, delete AI model providers (OpenAI, Anthropic, Google, StepFun, etc.) with built-in preset templates.
- **Preset Model Selection**: Choose from built-in presets, select models from dropdown, and set custom aliases.
- **Full Model CRUD**: Configure all 19 model parameters including ID, name, API type, reasoning, input types (text/image), cost (input/output/cacheRead/cacheWrite), contextWindow, maxTokens, custom headers, and full ModelCompat (supportsStore, supportsDeveloperRole, supportsReasoningEffort, maxTokensField, openRouterRouting, vercelGatewayRouting, extraBody).
- **Global Settings**: Default provider, model, Thinking Level, hide thinking blocks, budget configuration.
- **WebDAV Sync**: Sync configurations across devices via WebDAV (e.g., Jianguoyun, NextCloud).
- **File Bidirectional Sync**: SQLite as single source of truth, auto-export `models.yml` and `settings.json`, support external editor changes.
- **API Key Encryption**: AES-256-GCM encryption for sensitive data.
- **Offline First**: Local SQLite is always available; WebDAV sync failure does not affect daily use.

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [Rust](https://www.rust-lang.org/) >= 1.70
- OS-specific dependencies for Tauri 2: [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)

### Development

```bash
# Clone the repository
git clone https://github.com/Wenlong-Guo/omp-switch.git
cd omp-switch

# Install dependencies
npm install

# Run the Tauri dev app
npm run tauri dev
```

### Build

```bash
# Build the production app
npm run tauri build
```

## Architecture

```
omp-switch/
├── src/                       # React frontend (Vite)
│   ├── pages/                 # Dashboard, ProviderEditor, Settings
│   ├── stores/                # Zustand state management
│   └── components/            # Reusable UI components
├── src-tauri/                 # Rust backend (Tauri 2)
│   ├── src/commands/          # IPC command handlers
│   ├── src/services/          # Business logic
│   └── src/database/          # SQLite DAOs
├── e2e-playwright-test/       # Playwright E2E tests (17 tests)
│   ├── dashboard.spec.ts
│   ├── provider-crud.spec.ts
│   ├── model-config.spec.ts
│   ├── preset-selection.spec.ts
│   ├── stepfun.spec.ts
│   ├── settings.spec.ts
│   └── mocks/
└── docs/                      # Technical documentation (Chinese)
```

## Testing

```bash
# Unit tests (Vitest)
npm run test

# E2E tests (@playwright/test)
npx playwright test
```

## Download & Install

Visit the [Releases](../../releases) page to download pre-built binaries for your platform.

## Roadmap

| Version | Features |
|---------|----------|
| V0.1.0  | Project skeleton, SQLite schema, Provider CRUD |
| V0.1.1  | Comprehensive code review, 204 passing tests |
| V0.1.2  | Edit mode, delete confirmation, Toast notifications, dynamic version, encryption key security fix |
| V0.2.0  | Model override, cost configuration, WebDAV sync |

## License

MIT
