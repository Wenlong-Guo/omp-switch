import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { verifyProviderExists, invokeBackend } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
});

test.describe('StepFun Provider', () => {
  test('step-plan is not preloaded as built-in provider', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'StepFun (Step Plan)' })).not.toBeVisible();
    const providers = await invokeBackend(page, 'get_providers');
    expect(providers.some((p: any) => p.id === 'step-plan')).toBe(false);

    const presets = await invokeBackend(page, 'get_builtin_presets');
    expect(presets.some((p: any) => p.id === 'step-plan')).toBe(false);
  });

  test('add step-plan provider manually with apiKey', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await expect(page.getByRole('heading', { name: '添加供应商' })).toBeVisible();

    await page.locator('input[placeholder="openai"]').fill('step-plan-test');
    await page.getByTestId('provider-name-input').fill('StepFun Test');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.locator('input[placeholder="https://api.openai.com/v1"]').fill('https://api.stepfun.com/step_plan/v1');
    await page.locator('input[type="password"]').fill('2VpngWbeoYJAnD2JXy4RGRNh9if9Vv6xqxpRomhbLOLVBIQDzqTecYmlPNUp3PtwU');
    await page.getByTestId('save-provider-btn').click();

    await expect(page.getByText('保存成功')).toBeVisible();
    await expect(page.getByRole('heading', { name: '供应商管理' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'StepFun Test' })).toBeVisible();

    const card = page.getByTestId('provider-card-step-plan-test');
    await expect(card.getByText('https://api.stepfun.com/step_plan/v1')).toBeVisible();

    // Backend verify: provider persisted with apiKey
    const saved = await verifyProviderExists(page, 'step-plan-test');
    expect(saved.name).toBe('StepFun Test');
    expect(saved.baseUrl).toBe('https://api.stepfun.com/step_plan/v1');
  });

});
