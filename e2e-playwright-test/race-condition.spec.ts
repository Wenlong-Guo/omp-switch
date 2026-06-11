import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { getProviders, verifyProviderExists, verifyProviderDeleted } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
});


test.describe('Race Condition', () => {
  test('rapid double-click save does not duplicate provider', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('race-test');
    await page.getByTestId('provider-name-input').fill('Race Test');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');

    // Double-click save rapidly
    const saveBtn = page.getByTestId('save-provider-btn');
    await saveBtn.click({ clickCount: 2, delay: 50 });

    await expect(page.getByText('保存成功')).toBeVisible();

    // Verify provider saved (mock in-memory, no refresh)
    await expect(page.getByTestId('provider-card-race-test')).toBeVisible();

    // Backend verify: exactly one race-test provider
    const providers = await getProviders(page);
    const raceTests = providers.filter((p: any) => p.id === 'race-test');
    expect(raceTests.length).toBe(1);
  });

  test('rapid add then delete provider', async ({ page }) => {
    // Add provider
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('rapid-test');
    await page.getByTestId('provider-name-input').fill('Rapid Test');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();

    // Backend verify: provider exists before delete
    await verifyProviderExists(page, 'rapid-test');

    // Immediately delete
    const card = page.getByTestId('provider-card-rapid-test');
    await card.getByRole('button', { name: '删除' }).click();
    await page.getByRole('button', { name: '确认' }).click();
    await expect(page.getByText('删除成功')).toBeVisible();

    // Verify gone
    await expect(page.getByTestId('provider-card-rapid-test')).not.toBeVisible();

    // Backend verify: provider removed
    await verifyProviderDeleted(page, 'rapid-test');
  });

  test('rapid expand collapse model list', async ({ page }) => {
    const ollamaCard = page.getByTestId('provider-card-ollama');
    const btn = ollamaCard.getByRole('button', { name: /个模型/ });

    await btn.click();
    await btn.click();
    await btn.click();

    await expect(ollamaCard.getByText('Llama 3.2', { exact: true })).toBeVisible();
  });

  test('rapid set default multiple providers', async ({ page }) => {
    const ollamaCard = page.getByTestId('provider-card-ollama');
    await ollamaCard.getByRole('button', { name: '设为默认' }).click();

    // Backend verify: ollama is default
    const settings = await page.evaluate(async () => {
      const internals = (window as any).__TAURI_INTERNALS__;
      return await internals.invoke('get_settings');
    });
    expect(settings.defaultProvider).toBe('ollama');
  });

  test('concurrent add and navigate', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('concurrent-test');
    await page.getByTestId('provider-name-input').fill('Concurrent');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');

    // Navigate away before saving
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Backend verify: not saved
    await verifyProviderDeleted(page, 'concurrent-test');
  });
});
