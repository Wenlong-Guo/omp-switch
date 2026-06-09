import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test.describe('Keyboard Shortcuts', () => {
  test('Escape closes model editor dialog', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('add-model-btn').click();
    await expect(page.getByTestId('model-editor-dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('model-editor-dialog')).not.toBeVisible();
  });

  test('Escape closes confirm dialog', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '删除' }).click();
    await expect(page.getByRole('heading', { name: '确认删除' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: '确认删除' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'OpenAI' })).toBeVisible();
  });
});
