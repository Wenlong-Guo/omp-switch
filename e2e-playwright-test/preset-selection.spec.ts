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
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await expect(page.getByRole('heading', { name: '添加 Provider' })).toBeVisible();

    // Select StepFun preset
    await page.getByTestId('preset-select').selectOption('step-plan');

    // Verify preset info auto-filled
    await expect(page.locator('input[placeholder="openai"]')).toHaveValue('step-plan');
    await expect(page.locator('input[placeholder="OpenAI"]')).toHaveValue('StepFun (Step Plan)');

    // Select model from dropdown
    await page.getByTestId('model-select').selectOption('step-3.7-flash');

    // Set alias
    await page.getByTestId('model-alias-input').fill('我的Step模型');

    // Save provider
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Provider 管理' })).toBeVisible();

    // Verify on dashboard
    await expect(page.getByRole('heading', { name: 'StepFun (Step Plan)' })).toBeVisible();

    // Backend verify: preset provider saved with models
    const saved = await verifyProviderExists(page, 'step-plan');
    expect(saved.models.length).toBeGreaterThanOrEqual(1);

    // Re-edit and verify model alias persisted
    const card = page.getByTestId('provider-card-step-plan');
    await card.getByRole('button', { name: '编辑' }).click();
    await expect(page.getByText('我的Step模型')).toBeVisible();
  });

  test('select preset without model then manual add', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();

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
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('preset-select').selectOption('openai');
    await expect(page.locator('input[placeholder="openai"]')).toHaveValue('openai');
    await expect(page.locator('input[placeholder="OpenAI"]')).toHaveValue('OpenAI');

    // Switch to step-plan
    await page.getByTestId('preset-select').selectOption('step-plan');
    await expect(page.locator('input[placeholder="openai"]')).toHaveValue('step-plan');
    await expect(page.locator('input[placeholder="OpenAI"]')).toHaveValue('StepFun (Step Plan)');
  });

  test('manual config clears form', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('preset-select').selectOption('openai');
    await expect(page.locator('input[placeholder="openai"]')).toHaveValue('openai');

    await page.getByTestId('preset-select').selectOption('');
    await expect(page.locator('input[placeholder="openai"]')).toHaveValue('');
  });

  test('preset with multiple models', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('preset-select').selectOption('step-plan');

    // Should have model select with options
    await page.getByTestId('model-select').selectOption('step-4.0');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();

    const saved = await verifyProviderExists(page, 'step-plan');
    expect(saved.models.length).toBeGreaterThanOrEqual(2);
  });

  test('save preset provider and verify backend', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('preset-select').selectOption('anthropic');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();

    const saved = await verifyProviderExists(page, 'anthropic');
    expect(saved.api).toBe('anthropic-messages');
    expect(saved.baseUrl).toBe('https://api.anthropic.com');
  });
});