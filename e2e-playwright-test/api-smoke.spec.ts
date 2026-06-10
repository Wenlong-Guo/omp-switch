import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { verifyProviderExists, verifyDefaultProvider, invokeBackend } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
});


test.describe('API Smoke', () => {
  test('chat completion returns valid response', async ({ page }) => {
    // Step 1: Create provider with model
    await page.getByRole('button', { name: '添加供应商' }).click();
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

    // Backend verify: provider persisted
    const saved = await verifyProviderExists(page, 'smoke-test');
    expect(saved.models.some((m: any) => m.id === 'step-3.7-flash')).toBe(true);

    // Step 2: Verify provider card shows model info (expand models)
    const card = page.getByTestId('provider-card-smoke-test');
    await card.getByRole('button', { name: /个模型/ }).click();
    await expect(card.getByText('step-3.7-flash')).toBeVisible();
    await expect(card.getByText('Step 3.7 Flash')).toBeVisible();

    // Step 3: Set as active
    await card.getByRole('button', { name: /设为默认/ }).click();

    // Backend verify: default provider updated
    await verifyDefaultProvider(page, 'smoke-test');

    // Step 4: Backend chat completion works
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: '1+2 = 几几?' }],
    });
    expect(result.choices[0].message.content).toContain('3');
  });

  test('chat completion with different message formats', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [
        { role: 'system', content: 'You are a calculator' },
        { role: 'user', content: 'Calculate 5*6' },
      ],
    });
    expect(result.choices[0].message.role).toBe('assistant');
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('backend returns provider list', async ({ page }) => {
    const providers = await invokeBackend(page, 'get_providers');
    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBeGreaterThanOrEqual(3);
  });

  test('backend version matches UI', async ({ page }) => {
    const version = await invokeBackend(page, 'get_version');
    expect(version).toBe('0.1.3');
    await expect(page.getByText('v0.1.3')).toBeVisible();
  });
});
