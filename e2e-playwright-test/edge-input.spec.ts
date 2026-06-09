import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test.describe('Edge Input', () => {
  test('200-character name accepted', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('long-name-test');
    const longName = 'A'.repeat(200);
    await page.getByTestId('provider-name-input').fill(longName);
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();

    await expect(page.getByText('保存成功')).toBeVisible();
    await expect(page.getByRole('heading', { name: longName })).toBeVisible();
  });

  test('chinese name accepted', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('chinese-test');
    await page.getByTestId('provider-name-input').fill('中文测试Provider');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();

    await expect(page.getByText('保存成功')).toBeVisible();
    await expect(page.getByRole('heading', { name: '中文测试Provider' })).toBeVisible();
  });

  test('emoji in model name accepted', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
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
  });
});
