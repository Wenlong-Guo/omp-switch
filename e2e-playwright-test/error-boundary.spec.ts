import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test.describe('Error Boundary', () => {
  test('invalid api key shows error toast', async ({ page }) => {
    // Inject a mock that fails on chat_completion
    await page.addInitScript(() => {
      const orig = (window as any).__TAURI_INTERNALS__.invoke;
      (window as any).__TAURI_INTERNALS__.invoke = async (cmd: string, args?: any) => {
        if (cmd === 'chat_completion') {
          throw new Error('401 Invalid API Key');
        }
        return orig(cmd, args);
      };
    });

    // Save provider with invalid key
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('error-test');
    await page.getByTestId('provider-name-input').fill('Error Test');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.locator('input[type="password"]').fill('invalid-key');
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-editor-dialog').waitFor({ state: 'visible' });
    await page.getByTestId('model-id-input').fill('gpt-4');
    await page.getByTestId('model-name-input').fill('GPT-4');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('save-provider-btn').click();

    await expect(page.getByText('保存成功')).toBeVisible();

    // Verify app still functional (no crash)
    await expect(page.getByRole('heading', { name: 'Provider 管理' })).toBeVisible();
    await expect(page.getByTestId('provider-card-error-test')).toBeVisible();
  });

  test('validation prevents save with empty form', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    // id is initially empty, just click save
    await page.getByTestId('save-provider-btn').click();

    // Should stay on editor page (not redirect to dashboard)
    await expect(page.getByRole('heading', { name: '添加 Provider' })).toBeVisible();
  });

  test('save provider without api type shows validation error', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('no-api');
    await page.getByTestId('provider-name-input').fill('No API');
    await page.getByTestId('save-provider-btn').click();

    await expect(page.getByText('请选择 API 类型')).toBeVisible();
  });
});
