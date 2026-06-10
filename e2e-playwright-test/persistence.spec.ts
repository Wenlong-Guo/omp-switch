import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { verifyProviderExists, verifyProviderDeleted, verifySettings } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
});


test.describe('Data Persistence', () => {
  test('provider survives page refresh', async ({ page }) => {
    // Add provider
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('persist-test');
    await page.getByTestId('provider-name-input').fill('Persist Test');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();

    // Backend verify before refresh
    await verifyProviderExists(page, 'persist-test');

    // Refresh
    await page.reload();
    await page.waitForLoadState('networkidle');


    // Debug after reload
    const debugAfter = await page.evaluate(() => {
      return {
        ls: localStorage.getItem('__TAURI_MOCK_STATE__'),
        providers: (window as any).__TAURI_MOCK_STATE__?.providers?.map((p) => p.id) ?? [],
      };
    });

    // Backend verify after refresh
    await verifyProviderExists(page, 'persist-test');
    await expect(page.getByRole('heading', { name: 'Persist Test' })).toBeVisible();
  });

  test('model survives page refresh', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();

    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('persist-model');
    await page.getByTestId('model-name-input').fill('Persist Model');
    await page.getByTestId('save-model-btn').click();

    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功')).toBeVisible();

    // Backend verify
    const provider = await verifyProviderExists(page, 'openai');
    expect(provider.models.some((m: any) => m.id === 'persist-model')).toBe(true);

    // Refresh and verify model still there
    await page.reload();
    await page.waitForLoadState('networkidle');

    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await expect(page.getByTestId('model-item-persist-model')).toBeVisible();
  });

  test('settings survive page refresh', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click();
    await page.locator('select').selectOption('xhigh');
    await page.getByRole('button', { name: '保存设置' }).click();
    await expect(page.getByText('保存成功')).toBeVisible();

    // Backend verify before refresh
    await verifySettings(page, { defaultThinkingLevel: 'xhigh' });

    // Refresh
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: '设置', exact: true }).click();

    // Backend verify after refresh
    await verifySettings(page, { defaultThinkingLevel: 'xhigh' });
  });

  test('delete provider persists after refresh', async ({ page }) => {
    // Delete openai
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '删除' }).click();
    await page.getByRole('button', { name: '确认' }).click();
    await expect(page.getByText('删除成功')).toBeVisible();

    // Backend verify before refresh
    await verifyProviderDeleted(page, 'openai');

    // Refresh
    await page.reload();
    await page.waitForLoadState('networkidle');


    // Backend verify after refresh
    await verifyProviderDeleted(page, 'openai');
    await expect(page.getByRole('heading', { name: 'OpenAI' })).not.toBeVisible();
  });
});