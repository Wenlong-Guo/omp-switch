import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { getProviders, verifyDefaultProvider, verifyModelCall } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
});

test.afterEach(async ({ page }) => {
  await verifyModelCall(page);
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

  test('search filters providers by name', async ({ page }) => {
    await page.getByPlaceholder(/搜索 Provider/).fill('StepFun');
    await expect(page.getByRole('heading', { name: 'StepFun (Step Plan)' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'OpenAI' })).not.toBeVisible();
  });

  test('search with no results shows empty state', async ({ page }) => {
    await page.getByPlaceholder(/搜索 Provider/).fill('zzzzzzzz');
    await expect(page.getByText('暂无 Provider')).toBeVisible();
  });

  test('expand model list shows models', async ({ page }) => {
    const stepPlanCard = page.getByTestId('provider-card-step-plan');
    await stepPlanCard.getByRole('button', { name: /个模型/ }).click();
    await expect(stepPlanCard.getByText('Step 3.7 Flash')).toBeVisible();
  });

  test('provider without model cannot set default', async ({ page }) => {
    // anthropic mock has no models
    const anthropicCard = page.getByTestId('provider-card-anthropic');
    await anthropicCard.getByRole('button', { name: '设为默认' }).click();
    await expect(page.getByText('该 Provider 没有模型，无法设为默认')).toBeVisible();

    // Backend verify: defaultProvider unchanged
    const settings = await page.evaluate(async () => {
      const internals = (window as any).__TAURI_INTERNALS__;
      return await internals.invoke('get_settings');
    });
    expect(settings.defaultProvider).not.toBe('anthropic');
  });

  test('current default provider button disabled', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    const btn = openaiCard.getByRole('button', { name: '当前默认' });
    await expect(btn).toBeVisible();
    await expect(btn).toBeDisabled();
  });

  test('export json button triggers download', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '导出 JSON' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/providers-.*\.json/);
  });

  test('clear search restores all providers', async ({ page }) => {
    await page.getByPlaceholder(/搜索 Provider/).fill('StepFun');
    await expect(page.getByRole('heading', { name: 'OpenAI' })).not.toBeVisible();

    await page.getByPlaceholder(/搜索 Provider/).fill('');
    await expect(page.getByRole('heading', { name: 'OpenAI' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Anthropic' })).toBeVisible();
  });

  test('disabled provider shows badge', async ({ page }) => {
    // Disable a provider via backend
    await page.evaluate(async () => {
      const internals = (window as any).__TAURI_INTERNALS__;
      const providers = await internals.invoke('get_providers');
      const openai = providers.find((p: any) => p.id === 'openai');
      openai.enabled = false;
      await internals.invoke('save_provider', { config: openai });
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => { (window as any).__resetTauriMock?.(); });

    const openaiCard = page.getByTestId('provider-card-openai');
    await expect(openaiCard.getByText('已停用')).toBeVisible();
  });
});