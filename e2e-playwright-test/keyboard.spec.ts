import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { getProviders, verifyProviderExists } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
});

test.describe('Keyboard Shortcuts', () => {
  test('Escape closes model editor dialog', async ({ page }) => {
    const before = await getProviders(page);

    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('add-model-btn').click();
    await expect(page.getByTestId('model-editor-dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('model-editor-dialog')).not.toBeVisible();

    // Backend verify: no provider state changed by cancel
    const after = await getProviders(page);
    expect(after.length).toBe(before.length);
  });

  test('Escape closes confirm dialog', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '删除' }).click();
    await expect(page.getByRole('heading', { name: '确认删除' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: '确认删除' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'OpenAI' })).toBeVisible();

    // Backend verify: provider still exists after cancel
    const providers = await getProviders(page);
    expect(providers.some((p: any) => p.id === 'openai')).toBe(true);
  });

  test('Enter submits provider form', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('enter-test');
    await page.getByTestId('provider-name-input').fill('Enter Test');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');

    await page.keyboard.press('Enter');
    await expect(page.getByText('保存成功')).toBeVisible();

    await verifyProviderExists(page, 'enter-test');
  });

});