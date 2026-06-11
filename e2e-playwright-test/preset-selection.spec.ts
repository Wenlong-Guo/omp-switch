import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { verifyProviderExists } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
});


test.describe('Preset Model Selection', () => {
  test('select preset and model with alias', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await expect(page.getByRole('heading', { name: '添加供应商' })).toBeVisible();

    // Select Ollama preset
    await page.getByTestId('preset-select').selectOption('ollama');

    // Verify preset info auto-filled
    await expect(page.locator('input[placeholder="openai"]')).toHaveValue('ollama');
    await expect(page.getByTestId('provider-name-input')).toHaveValue('Ollama');

    // Select model from dropdown
    await page.getByTestId('model-select').selectOption('llama3-2');

    // Set alias
    await page.getByTestId('model-alias-input').fill('我的Ollama模型');

    // Save provider
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await expect(page.getByRole('heading', { name: '供应商管理' })).toBeVisible();

    // Verify on dashboard
    await expect(page.getByRole('heading', { name: 'Ollama' })).toBeVisible();

    // Backend verify: preset provider saved with models
    const saved = await verifyProviderExists(page, 'ollama');
    expect(saved.models.length).toBeGreaterThanOrEqual(1);

    // Re-edit and verify model alias persisted
    const card = page.getByTestId('provider-card-ollama');
    await card.getByRole('button', { name: '编辑' }).click();
    await expect(page.getByText('我的Ollama模型')).toBeVisible();
  });

  test('select preset without model then manual add', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();

    // Select OpenAI preset (no models in mock)
    await page.getByTestId('preset-select').selectOption('openai');
    await expect(page.locator('input[placeholder="openai"]')).toHaveValue('openai');

    // No model dropdown since OpenAI preset has no models
    await expect(page.getByTestId('model-select')).not.toBeVisible();

    // Add model manually
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('gpt-4');
    await page.getByTestId('model-name-input').fill('GPT-4');
    await page.getByTestId('save-model-btn').click();

    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();

    // Backend verify: provider saved with manually added model
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.models.some((m: any) => m.id === 'gpt-4')).toBe(true);
  });

  test('change preset re-fills form', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('preset-select').selectOption('openai');
    await expect(page.locator('input[placeholder="openai"]')).toHaveValue('openai');
    await expect(page.getByTestId('provider-name-input')).toHaveValue('OpenAI');

    // Switch to ollama
    await page.getByTestId('preset-select').selectOption('ollama');
    await expect(page.locator('input[placeholder="openai"]')).toHaveValue('ollama');
    await expect(page.getByTestId('provider-name-input')).toHaveValue('Ollama');
  });

  test('manual config preserves filled form', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('keep-provider');
    await page.getByTestId('provider-name-input').fill('Keep Provider');
    await page.locator('input[placeholder="https://api.openai.com/v1"]').fill('https://keep.example.com/v1');
    await page.getByTestId('preset-select').selectOption('openai');

    await page.getByTestId('preset-select').selectOption('');
    await expect(page.getByTestId('provider-id-input')).toHaveValue('keep-provider');
    await expect(page.getByTestId('provider-name-input')).toHaveValue('Keep Provider');
    await expect(page.locator('input[placeholder="https://api.openai.com/v1"]')).toHaveValue('https://keep.example.com/v1');
  });

  test('openai compatible preset only changes interface format', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('compatible-test');
    await page.getByTestId('provider-name-input').fill('Compatible Test');
    await page.getByTestId('preset-select').selectOption('openai-compatible');
    await expect(page.getByTestId('provider-id-input')).toHaveValue('compatible-test');
    await expect(page.getByTestId('provider-name-input')).toHaveValue('Compatible Test');
    await expect(page.getByTestId('provider-api-select')).toHaveValue('openai-completions');
  });

  test('preset with multiple models', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('preset-select').selectOption('ollama');

    // Should have model select with options
    await page.getByTestId('model-select').selectOption('qwen2.5');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();

    const saved = await verifyProviderExists(page, 'ollama');
    expect(saved.models.length).toBeGreaterThanOrEqual(2);
  });

  test('save preset provider and verify backend', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('preset-select').selectOption('anthropic');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();

    const saved = await verifyProviderExists(page, 'anthropic');
    expect(saved.api).toBe('anthropic-messages');
    expect(saved.baseUrl).toBe('https://api.anthropic.com');
  });
});
