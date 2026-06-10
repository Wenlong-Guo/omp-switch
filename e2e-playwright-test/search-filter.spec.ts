import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { getProviders } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
});


test.describe('Search and Filter', () => {
  test('search by provider name', async ({ page }) => {
    await page.getByPlaceholder(/搜索 Provider/).fill('StepFun');
    await expect(page.getByRole('heading', { name: 'StepFun (Step Plan)' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'OpenAI' })).not.toBeVisible();

    // Backend verify: actual provider count unchanged
    const providers = await getProviders(page);
    expect(providers.length).toBeGreaterThanOrEqual(3);
  });

  test('search by provider id', async ({ page }) => {
    await page.getByPlaceholder(/搜索 Provider/).fill('openai');
    await expect(page.getByRole('heading', { name: 'OpenAI' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Anthropic' })).not.toBeVisible();
  });

  test('search by api type', async ({ page }) => {
    await page.getByPlaceholder(/搜索 Provider/).fill('openai-completions');
    await expect(page.getByText('openai-completions').first()).toBeVisible();
  });

  test('clear search shows all providers', async ({ page }) => {
    await page.getByPlaceholder(/搜索 Provider/).fill('nonexistent');
    await expect(page.getByText('暂无 Provider')).toBeVisible();

    await page.getByPlaceholder(/搜索 Provider/).fill('');
    await expect(page.getByRole('heading', { name: 'OpenAI' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Anthropic' })).toBeVisible();
  });

  test('search case insensitive', async ({ page }) => {
    await page.getByPlaceholder(/搜索 Provider/).fill('openai');
    await expect(page.getByRole('heading', { name: 'OpenAI' })).toBeVisible();

    await page.getByPlaceholder(/搜索 Provider/).fill('OPENAI');
    await expect(page.getByRole('heading', { name: 'OpenAI' })).toBeVisible();
  });

  test('search with no results shows empty state', async ({ page }) => {
    await page.getByPlaceholder(/搜索 Provider/).fill('zzzzzzzzz');
    await expect(page.getByText('暂无 Provider')).toBeVisible();
  });
});