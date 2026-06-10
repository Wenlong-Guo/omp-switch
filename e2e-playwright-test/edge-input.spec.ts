import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { verifyProviderExists } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
});


test.describe('Edge Input', () => {
  test('200-character name accepted', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('long-name-test');
    const longName = 'A'.repeat(200);
    await page.getByTestId('provider-name-input').fill(longName);
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();

    await expect(page.getByText('保存成功')).toBeVisible();
    await expect(page.getByRole('heading', { name: longName })).toBeVisible();

    // Backend verify: name persisted correctly
    const saved = await verifyProviderExists(page, 'long-name-test');
    expect(saved.name).toBe(longName);
  });

  test('chinese name accepted', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('chinese-test');
    await page.getByTestId('provider-name-input').fill('中文测试Provider');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();

    await expect(page.getByText('保存成功')).toBeVisible();
    await expect(page.getByRole('heading', { name: '中文测试Provider' })).toBeVisible();

    // Backend verify: Chinese name persisted
    const saved = await verifyProviderExists(page, 'chinese-test');
    expect(saved.name).toBe('中文测试Provider');
  });

  test('emoji in model name accepted', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('emoji-test');
    await page.getByTestId('provider-name-input').fill('Emoji Test');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');

    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-editor-dialog').waitFor({ state: 'visible' });
    await page.getByTestId('model-id-input').fill('gpt-emoji');
    await page.getByTestId('model-name-input').fill('GPT-4 🚀');
    await page.getByTestId('save-model-btn').click();

    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();

    // Backend verify: emoji model name persisted
    const saved = await verifyProviderExists(page, 'emoji-test');
    const model = saved.models.find((m: any) => m.id === 'gpt-emoji');
    expect(model.name).toBe('GPT-4 🚀');
  });

  test('special chars in provider id', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('test_123-special');
    await page.getByTestId('provider-name-input').fill('Special Chars');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();

    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, 'test_123-special');
  });

  test('empty model id rejected', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('empty-model');
    await page.getByTestId('provider-name-input').fill('Empty Model');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');

    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-name-input').fill('No ID Model');
    await page.getByTestId('model-id-input').fill('');
    await page.getByTestId('save-model-btn').click();

    await expect(page.getByTestId('model-editor-dialog')).toBeVisible();
  });

  test('negative cost value accepted', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('negative-cost');
    await page.getByTestId('provider-name-input').fill('Negative Cost');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');

    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('neg-cost-model');
    await page.getByTestId('model-name-input').fill('Neg Cost');
    await page.getByRole('button', { name: '成本与限制' }).click();

    // Try to set negative value (browser allows it)
    await page.getByTestId('model-context-window').fill('-1');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('save-provider-btn').click();

    await expect(page.getByText('保存成功')).toBeVisible();

    const saved = await verifyProviderExists(page, 'negative-cost');
    const model = saved.models.find((m: any) => m.id === 'neg-cost-model');
    expect(model.contextWindow).toBe(-1);
  });

  test('very long model name', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('long-model-name');
    await page.getByTestId('provider-name-input').fill('Long Model');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');

    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('long-name');
    const longName = 'B'.repeat(300);
    await page.getByTestId('model-name-input').fill(longName);
    await page.getByTestId('save-model-btn').click();

    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();

    const saved = await verifyProviderExists(page, 'long-model-name');
    const model = saved.models.find((m: any) => m.id === 'long-name');
    expect(model.name).toBe(longName);
  });

  test('zero max tokens', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('zero-tokens');
    await page.getByTestId('provider-name-input').fill('Zero Tokens');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');

    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('zero-tok');
    await page.getByTestId('model-name-input').fill('Zero Tok');
    await page.getByRole('button', { name: '成本与限制' }).click();
    await page.getByTestId('model-max-tokens').fill('0');
    await page.getByTestId('save-model-btn').click();

    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();

    const saved = await verifyProviderExists(page, 'zero-tokens');
    const model = saved.models.find((m: any) => m.id === 'zero-tok');
    expect(model.maxTokens).toBe(0);
  });
});
