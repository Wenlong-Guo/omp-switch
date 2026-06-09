import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test.describe('StepFun Provider', () => {
  test('step-plan preset displays with model info', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'StepFun (Step Plan)' })).toBeVisible();

    const stepPlanCard = page.getByTestId('provider-card-step-plan');
    await expect(stepPlanCard.getByText('openai-completions')).toBeVisible();
    await expect(stepPlanCard.getByText('https://api.stepfun.com/step_plan/v1')).toBeVisible();
  });

  test('add step-plan provider manually with apiKey', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await expect(page.getByRole('heading', { name: '添加 Provider' })).toBeVisible();

    await page.locator('input[placeholder="openai"]').fill('step-plan-test');
    await page.locator('input[placeholder="OpenAI"]').fill('StepFun Test');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.locator('input[placeholder="https://api.openai.com/v1"]').fill('https://api.stepfun.com/step_plan/v1');
    await page.locator('input[type="password"]').fill('2VpngWbeoYJAnD2JXy4RGRNh9if9Vv6xqxpRomhbLOLVBIQDzqTecYmlPNUp3PtwU');
    await page.getByTestId('save-provider-btn').click();

    await expect(page.getByText('保存成功')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Provider 管理' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'StepFun Test' })).toBeVisible();

    const card = page.getByTestId('provider-card-step-plan-test');
    await expect(card.getByText('https://api.stepfun.com/step_plan/v1')).toBeVisible();
  });

  test('step-plan chat completion returns correct answer', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const internals = (window as any).__TAURI_INTERNALS__;
      return await internals.invoke('chat_completion', {
        messages: [{ role: 'user', content: '1+2 = 几' }],
      });
    });
    expect(result.choices[0].message.content).toBe('3');
  });

  test('edit built-in step-plan provider does not crash', async ({ page }) => {
    const stepPlanCard = page.getByTestId('provider-card-step-plan');
    await expect(stepPlanCard).toBeVisible();

    await stepPlanCard.getByRole('button', { name: '编辑' }).click();

    // Should navigate to editor without crash
    await expect(page.getByRole('heading', { name: /编辑 Provider/ })).toBeVisible();
    await expect(page.getByTestId('provider-id-input')).toHaveValue('step-plan');
    await expect(page.getByTestId('provider-name-input')).toHaveValue('StepFun (Step Plan)');
    await expect(page.getByTestId('provider-api-select')).toHaveValue('openai-completions');

    // Model list should render with context/maxTokens info
    await expect(page.getByText('Step 3.7 Flash')).toBeVisible();
    await expect(page.getByText('128,000 ctx')).toBeVisible();
  });
});
