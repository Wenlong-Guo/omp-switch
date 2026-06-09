import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { getProviders, verifyDefaultProvider } from './utils/backend-verify';

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

    // Backend verify: provider list matches
    const providers = await getProviders(page);
    expect(providers.length).toBeGreaterThanOrEqual(2);
    expect(providers.some((p: any) => p.id === 'openai')).toBe(true);
    expect(providers.some((p: any) => p.id === 'anthropic')).toBe(true);
  });

  test('set active provider', async ({ page }) => {
    // step-plan has models, can be set as default
    const stepPlanCard = page.getByTestId('provider-card-step-plan');
    await stepPlanCard.getByRole('button', { name: '设为默认' }).click();
    await expect(stepPlanCard.getByText('默认', { exact: true })).toBeVisible();
    await expect(page.getByText('默认: step-plan')).toBeVisible();

    // Backend verify: defaultProvider updated in settings
    await verifyDefaultProvider(page, 'step-plan');
  });

  test('navigate to add provider', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await expect(page.getByRole('heading', { name: '添加 Provider' })).toBeVisible();
  });
});
