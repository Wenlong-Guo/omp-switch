import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { verifyModelCall } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
});

test.afterEach(async ({ page }) => {
  await verifyModelCall(page);
});

test.describe('WebDAV Sync', () => {
  test('navigate to sync page', async ({ page }) => {
    await page.goto('/sync');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'WebDAV 同步' })).toBeVisible();
  });

  test('sync page shows form fields', async ({ page }) => {
    await page.goto('/sync');
    await page.waitForLoadState('networkidle');

    await expect(page.getByLabel('启用同步')).toBeVisible();
    await expect(page.getByPlaceholder('https://dav.jianguoyun.com/dav/')).toBeVisible();
    await expect(page.getByRole('button', { name: '测试连接' })).toBeVisible();
    await expect(page.getByRole('button', { name: '保存配置' })).toBeVisible();
    await expect(page.getByRole('button', { name: '上传' })).toBeVisible();
    await expect(page.getByRole('button', { name: '下载' })).toBeVisible();
  });

  test('save sync config persists', async ({ page }) => {
    await page.goto('/sync');
    await page.waitForLoadState('networkidle');

    await page.getByLabel('启用同步').check();
    await page.getByPlaceholder('https://dav.jianguoyun.com/dav/').fill('https://test.example.com/dav/');
    await page.getByRole('button', { name: '保存配置' }).click();

    // Reload and verify config persisted
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByLabel('启用同步')).toBeChecked();
    await expect(page.getByPlaceholder('https://dav.jianguoyun.com/dav/')).toHaveValue('https://test.example.com/dav/');
  });

  test('test connection with empty config fails', async ({ page }) => {
    await page.goto('/sync');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: '测试连接' }).click();
    await expect(page.locator('main').getByText('连接失败')).toBeVisible();
  });

  test('upload button triggers sync', async ({ page }) => {
    await page.goto('/sync');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: '上传' }).click();
    // In mock mode, this should complete without error
    await expect(page.getByRole('button', { name: '上传' })).toBeEnabled();
  });

  test('download button triggers sync', async ({ page }) => {
    await page.goto('/sync');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: '下载' }).click();
    // In mock mode, this should complete without error
    await expect(page.getByRole('button', { name: '下载' })).toBeEnabled();
  });

  test('back button returns to dashboard', async ({ page }) => {
    await page.goto('/sync');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: '返回' }).click();
    await expect(page.getByRole('heading', { name: 'Provider 管理' })).toBeVisible();
  });

  test('sync disabled by default', async ({ page }) => {
    await page.goto('/sync');
    await page.waitForLoadState('networkidle');

    await expect(page.getByLabel('启用同步')).not.toBeChecked();
  });
});
