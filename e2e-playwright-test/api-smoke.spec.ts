import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test.describe('API Smoke', () => {
  test('chat completion returns valid response', async ({ page }) => {
    // Step 1: Create provider with model
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('smoke-test');
    await page.getByTestId('provider-name-input').fill('Smoke Test');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.locator('input[placeholder="https://api.openai.com/v1"]').fill('https://api.stepfun.com/step_plan/v1');
    await page.locator('input[type="password"]').fill('test-key');

    // Add model
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-editor-dialog').waitFor({ state: 'visible' });
    await page.getByTestId('model-id-input').fill('step-3.7-flash');
    await page.getByTestId('model-name-input').fill('Step 3.7 Flash');
    await page.getByTestId('save-model-btn').click();
    await expect(page.getByTestId('model-item-step-3.7-flash')).toBeVisible();

    // Save provider
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();

    // Step 2: Verify provider card shows model info (expand models)
    const card = page.getByTestId('provider-card-smoke-test');
    await card.getByRole('button', { name: /个模型/ }).click();
    await expect(card.getByText('step-3.7-flash')).toBeVisible();
    await expect(card.getByText('Step 3.7 Flash')).toBeVisible();

    // Step 3: Set as active
    await card.getByRole('button', { name: /设为默认/ }).click();
  });
});
