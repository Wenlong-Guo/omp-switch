import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { verifySettings } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test.describe('Settings', () => {
  test('change thinking level', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click();
    await expect(page.getByRole('heading', { name: '全局设置' })).toBeVisible();

    await page.locator('select').selectOption('high');
    await page.getByRole('button', { name: '保存设置' }).click();

    await expect(page.getByText('保存成功')).toBeVisible();

    // Backend verify: settings persisted
    await verifySettings(page, { defaultThinkingLevel: 'high' });
  });
});
