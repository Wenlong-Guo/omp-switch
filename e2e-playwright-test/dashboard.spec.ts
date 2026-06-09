import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test.describe('Dashboard', () => {
  test('displays provider cards and default badge', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'OpenAI' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Anthropic' })).toBeVisible();
    await expect(page.getByText('默认', { exact: true })).toBeVisible();
    await expect(page.getByText('默认: openai')).toBeVisible();
  });

  test('set active provider', async ({ page }) => {
    const anthropicCard = page.getByTestId('provider-card-anthropic');
    await anthropicCard.getByRole('button', { name: '设为默认' }).click();
    await expect(anthropicCard.getByText('默认', { exact: true })).toBeVisible();
    await expect(page.getByText('默认: anthropic')).toBeVisible();
  });

  test('navigate to add provider', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await expect(page.getByRole('heading', { name: '添加 Provider' })).toBeVisible();
  });
});
