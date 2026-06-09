import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test.describe('Race Condition', () => {
  test('rapid double-click save does not duplicate provider', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('race-test');
    await page.getByTestId('provider-name-input').fill('Race Test');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');

    // Double-click save rapidly
    const saveBtn = page.getByTestId('save-provider-btn');
    await saveBtn.click({ clickCount: 2, delay: 50 });

    await expect(page.getByText('保存成功')).toBeVisible();

    // Verify provider saved (mock in-memory, no refresh)
    await expect(page.getByTestId('provider-card-race-test')).toBeVisible();
  });

  test('rapid add then delete provider', async ({ page }) => {
    // Add provider
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('rapid-test');
    await page.getByTestId('provider-name-input').fill('Rapid Test');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();

    // Immediately delete
    const card = page.getByTestId('provider-card-rapid-test');
    await card.getByRole('button', { name: '删除' }).click();
    await page.getByRole('button', { name: '确认' }).click();
    await expect(page.getByText('删除成功')).toBeVisible();

    // Verify gone
    await expect(page.getByTestId('provider-card-rapid-test')).not.toBeVisible();
  });
});
