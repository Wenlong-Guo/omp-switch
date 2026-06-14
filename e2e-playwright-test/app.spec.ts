import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { invokeBackend } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
});


test.describe('App', () => {
    await expect(page.getByText('v1.0.0-rc')).toBeVisible();

    // Backend verify: version matches backend
    const version = await invokeBackend(page, 'get_version');
    expect(version).toBe('1.0.0-rc');
  });

  test('sidebar navigation to settings and back', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click();
    await expect(page.getByRole('heading', { name: '全局设置' })).toBeVisible();

    await page.getByLabel('返回').click();
    await expect(page.getByRole('heading', { name: '供应商管理' })).toBeVisible();
  });

  test('sidebar navigation to sync page', async ({ page }) => {
    await page.getByRole('button', { name: '同步' }).click();
    await expect(page.getByRole('heading', { name: 'WebDAV 同步' })).toBeVisible();
  });

  test('page transition animation completes', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await expect(page.getByRole('heading', { name: '添加供应商' })).toBeVisible();

    // Transition should complete without error
    await expect(page.locator('body')).not.toHaveClass(/error/);
  });
});
