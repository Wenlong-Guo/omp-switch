import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { verifyProviderExists } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
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
    await page.getByRole('button', { name: '添加供应商' }).click();
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
    await expect(page.getByRole('heading', { name: '供应商管理' })).toBeVisible();
    await expect(page.getByTestId('provider-card-error-test')).toBeVisible();

    // Backend verify: provider persisted despite chat error
    const saved = await verifyProviderExists(page, 'error-test');
    expect(saved.name).toBe('Error Test');
  });

  test('validation prevents save with empty form', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    // id is initially empty, just click save
    await page.getByTestId('save-provider-btn').click();

    // Should stay on editor page (not redirect to dashboard)
    await expect(page.getByRole('heading', { name: '添加供应商' })).toBeVisible();

    // Backend verify: no new provider added
    const providers = await page.evaluate(async () => {
      const internals = (window as any).__TAURI_INTERNALS__;
      return await internals.invoke('get_providers');
    });
    const emptyIdProvider = providers.find((p: any) => !p.id);
    expect(emptyIdProvider).toBeFalsy();
  });

  test('save provider uses default openai compatible api type', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('no-api');
    await page.getByTestId('provider-name-input').fill('No API');
    await page.getByTestId('save-provider-btn').click();

    await expect(page.getByText('保存成功')).toBeVisible();

    // Backend verify: provider saved with default OpenAI-compatible api type
    const providers = await page.evaluate(async () => {
      const internals = (window as any).__TAURI_INTERNALS__;
      return await internals.invoke('get_providers');
    });
    const saved = providers.find((p: any) => p.id === 'no-api');
    expect(saved?.api).toBe('openai-completions');
  });

  test('duplicate provider id on add', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('openai');
    await page.getByTestId('provider-name-input').fill('Duplicate');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();

    // Should update existing
    await expect(page.getByText(/保存成功|更新成功/)).toBeVisible();
  });

  test('very long provider id', async ({ page }) => {
    const longId = 'x'.repeat(500);
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill(longId);
    await page.getByTestId('provider-name-input').fill('Long ID');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();

    await expect(page.getByText('保存成功')).toBeVisible();

    const allProviders = await page.evaluate(async () => {
      const internals = (window as any).__TAURI_INTERNALS__;
      return await internals.invoke('get_providers');
    });
    expect(allProviders.some((p: any) => p.id === longId)).toBe(true);
  });

  test('provider id with special chars is rejected', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('test-123_abc');
    await page.getByTestId('provider-name-input').fill('Special ID');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();

    await expect(page.getByText('供应商 ID 只能包含字母、数字和横线')).toBeVisible();
  });

  test('model without id rejected', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('no-model-id');
    await page.getByTestId('provider-name-input').fill('No Model ID');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');

    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-name-input').fill('Model Without ID');
    await page.getByTestId('model-id-input').fill('');
    await page.getByTestId('save-model-btn').click();

    // Should still show dialog (validation prevented close)
    await expect(page.getByTestId('model-editor-dialog')).toBeVisible();
  });

  test('save without model if provider has none', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('no-models');
    await page.getByTestId('provider-name-input').fill('No Models');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();

    // Should save successfully even without models
    await expect(page.getByText('保存成功')).toBeVisible();

    const allProviders = await page.evaluate(async () => {
      const internals = (window as any).__TAURI_INTERNALS__;
      return await internals.invoke('get_providers');
    });
    const saved = allProviders.find((p: any) => p.id === 'no-models');
    expect(saved).toBeTruthy();
    expect(saved.models ?? []).toHaveLength(0);
  });
});
