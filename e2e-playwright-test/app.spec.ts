import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { invokeBackend } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test.describe('App', () => {
  test('dynamic version display', async ({ page }) => {
    await expect(page.getByText('v0.1.2')).toBeVisible();

    // Backend verify: version matches backend
    const version = await invokeBackend(page, 'get_version');
    expect(version).toBe('0.1.2');
  });
});
