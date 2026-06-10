import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { verifyProviderExists, invokeBackend, verifyModelCall } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
});

test.afterEach(async ({ page }) => {
  await verifyModelCall(page);
});

test.describe('StepFun Provider', () => {
  test('step-plan preset displays with model info', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'StepFun (Step Plan)' })).toBeVisible();

    const stepPlanCard = page.getByTestId('provider-card-step-plan');
    await expect(stepPlanCard.getByText('openai-completions')).toBeVisible();
    await expect(stepPlanCard.getByText('https://api.stepfun.com/step_plan/v1')).toBeVisible();

    // Backend verify: step-plan provider exists with correct model
    const provider = await verifyProviderExists(page, 'step-plan');
    expect(provider.models.length).toBeGreaterThanOrEqual(1);
    expect(provider.models.some((m: any) => m.id === 'step-3.7-flash')).toBe(true);
  });

  test('add step-plan provider manually with apiKey', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await expect(page.getByRole('heading', { name: '添加供应商' })).toBeVisible();

    await page.locator('input[placeholder="openai"]').fill('step-plan-test');
    await page.locator('input[placeholder="OpenAI"]').fill('StepFun Test');
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

  test('step-plan chat completion returns correct answer', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: '1+2 = 几' }],
    });
    expect(result.choices[0].message.content).toContain('3');
  });

  test('edit built-in step-plan provider does not crash', async ({ page }) => {
    const stepPlanCard = page.getByTestId('provider-card-step-plan');
    await expect(stepPlanCard).toBeVisible();

    await stepPlanCard.getByRole('button', { name: '编辑' }).click();

    // Should navigate to editor without crash
    await expect(page.getByRole('heading', { name: /编辑供应商/ })).toBeVisible();
    await expect(page.getByTestId('provider-id-input')).toHaveValue('step-plan');
    await expect(page.getByTestId('provider-name-input')).toHaveValue('StepFun (Step Plan)');
    await expect(page.getByTestId('provider-api-select')).toHaveValue('openai-completions');

    // Model list should render with context/maxTokens info
    await expect(page.getByText('Step 3.7 Flash')).toBeVisible();
    await expect(page.getByText('128,000 ctx')).toBeVisible();

    // Backend verify: model data intact
    const provider = await verifyProviderExists(page, 'step-plan');
    const model = provider.models.find((m: any) => m.id === 'step-3.7-flash');
    expect(model).toBeTruthy();
    expect(model.contextWindow).toBe(128000);
    expect(model.maxTokens).toBe(4096);
  });

  test('step-plan models count correct', async ({ page }) => {
    const provider = await verifyProviderExists(page, 'step-plan');
    expect(provider.models.length).toBe(1);
  });

  test('step-plan provider enabled status', async ({ page }) => {
    const provider = await verifyProviderExists(page, 'step-plan');
    expect(provider.enabled).toBe(true);
  });

  test('step-plan base url correct in backend', async ({ page }) => {
    const provider = await verifyProviderExists(page, 'step-plan');
    expect(provider.baseUrl).toBe('https://api.stepfun.com/step_plan/v1');
  });

  test('edit step-plan and save updates backend', async ({ page }) => {
    const stepPlanCard = page.getByTestId('provider-card-step-plan');
    await stepPlanCard.getByRole('button', { name: '编辑' }).click();
    await page.waitForSelector('input[placeholder="openai"][disabled]');

    await page.getByTestId('provider-name-input').fill('StepFun Updated');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();

    const updated = await verifyProviderExists(page, 'step-plan');
    expect(updated.name).toBe('StepFun Updated');
  });
});
