import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test.describe('App', () => {
  test('dynamic version display', async ({ page }) => {
    await expect(page.getByText('v0.1.2')).toBeVisible();
  });
});
