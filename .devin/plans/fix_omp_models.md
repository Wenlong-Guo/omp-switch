# 修复计划：oh-my-pi CLI 无法识别模型

## 根本原因

通过直接测试 `models.yml` 的各种配置组合，确认以下问题：

### 1. `config_writer.rs` 在 `api_key` 为空时写入 `apiKey: ''`
`config_writer.rs:39-45`：
```rust
if let Some(key) = p.api_key {
    config.insert("apiKey".to_string(), serde_json::Value::String(key));
} else if let Some(auth) = &p.auth {
    if auth != "none" {
        config.insert("apiKey".to_string(), serde_json::Value::String("".to_string()));
    }
}
```

**问题**：当 `api_key` 为 `None` 时，会写入 `apiKey: ""`（空字符串），而不是不写入该字段。

### 2. `step-plan` 内置预设导致 oh-my-pi 解析失败
`provider_service.rs:148-187` 中 `step-plan` 预设：
- `models: Some([...])`（full custom provider）
- `auth: Some("apiKey")`（需要认证）
- `api_key: None`（没有 API key）

**问题**：
- `step-plan` 不是 oh-my-pi 内置 provider
- 作为 full custom provider（有 `models` 列表），oh-my-pi 要求其必须有有效的 `apiKey`
- `step-plan` 在 `models.yml` 中呈现为 `apiKey: ""` 的 full custom provider
- oh-my-pi 遇到无效的 `step-plan` 后，**跳过整个 `models.yml` 中的所有自定义 provider 的模型**
- 即使用户创建了 `step-plan2`（有正确 API key），也因为 `step-plan` 的存在而被 oh-my-pi 忽略

### 3. 用户输入的 API key 未生效
当用户在前端输入 API key 并保存后，`models.yml` 中对应 provider 的 `apiKey` 仍然是 `''`。

**初步判断**：前端表单可能正确传递了数据，但由于 `step-plan` 的存在导致 oh-my-pi 整体解析失败，用户误以为自己的 API key 没有生效。

---

## 修改计划

### Step 1: 修复 `config_writer.rs` — 不为空的 `api_key` 写入 `apiKey`

**文件**: `src-tauri/src/services/config_writer.rs:39-45`

**修改**: 
```rust
if let Some(key) = p.api_key {
    if !key.is_empty() {
        config.insert("apiKey".to_string(), serde_json::Value::String(key));
    }
}
// 删除 else 分支，不再为 None 写入空字符串
```

**原因**: 
- 对于 override-only provider（如 `openai`，无 `models` 列表），不写入 `apiKey` 时 oh-my-pi 会从环境变量获取
- 对于 full custom provider（有 `models` 列表），不写入 `apiKey` 时 oh-my-pi 会单独判定该 provider 无效，而**不影响其他 provider**

### Step 2: 从内置预设中移除 `step-plan`

**文件**: `src-tauri/src/services/provider_service.rs:148-187`

**修改**: 删除 `step-plan` 的 `ProviderConfig` 定义，从 `get_builtin_presets()` 返回的 `vec![]` 中移除。

**原因**: 
- `step-plan` 不是 oh-my-pi 内置 provider
- 作为内置预设但没有默认 API key，会导致 oh-my-pi 解析失败
- 需要 StepFun 的用户可以手动添加自定义 provider

### Step 3: 清理用户数据库中残留的内置 `step-plan`

**文件**: `src-tauri/src/main.rs`（启动初始化逻辑）

**修改**: 在应用启动时，检查并删除数据库中 `id = "step-plan"` 且 `is_built_in = 1` 的记录。

**原因**: 用户之前启动应用时，`step-plan` 已被写入数据库。即使修改了内置预设，残留记录仍会被 `config_writer` 导出到 `models.yml`。

### Step 4: 验证前端 API key 保存流程

**文件**: `src/pages/ProviderEditor.tsx`

**检查**: 
- `ProviderBasicForm.tsx` 中 `onChange={(e) => update("apiKey", e.target.value || undefined)}` 是否正确传递
- `ProviderEditor.tsx` 中选择预设时是否清除了旧的 `apiKey`

**潜在问题**: `ProviderEditor.tsx` 中选择预设后 `setForm` 只更新了部分字段，可能保留了之前编辑的 `apiKey` 值。

---

## 测试验证

1. 修改后构建 Windows exe
2. 打开应用，确认 `step-plan` 不再出现在内置预设中
3. 为 `openai` 输入 API key 并保存
4. 检查 `models.yml` 中 `openai` 的 `apiKey` 为实际输入的值，而非 `''`
5. 新建自定义 provider（如 `step-plan2`），输入 API key，设置默认
6. 运行 `omp --list-models`，确认 `step-plan2` 的模型出现
7. 运行 `omp` 启动对话，确认默认模型可用

---

## 预期结果

- `models.yml` 中不再出现 `apiKey: ''`
- `step-plan` 不再导致 oh-my-pi 解析失败
- 用户自定义 provider 的模型正常显示在 `omp --list-models` 中
- 默认 provider/model 设置生效，`omp` 可正常启动
