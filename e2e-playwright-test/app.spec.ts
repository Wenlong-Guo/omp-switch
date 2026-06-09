import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test.describe('Dashboard', () => {
  test('dis provider cards and default badge', async ({ page }) => {
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

test.describe('ProviderEditor', () => {
  test('add provider manually', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await expect(page.getByRole('heading', { name: '添加 Provider' })).toBeVisible();

    await page.locator('input[placeholder="openai"]').fill('test-provider');
    await page.locator('input[placeholder="OpenAI"]').fill('Test Provider');
    await page.getByTestId('api-type-select').selectOption('openai-completions');
    await page.locator('input[placeholder="https://api.openai.com/v1"]').fill('https://api.test.com/v1');
    await page.locator('input[type="password"]').fill('test-api-key-123');
    await page.getByTestId('save-provider-btn').click();

    await expect(page.getByText('保存成功')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Provider 管理' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Test Provider' })).toBeVisible();
  });

  test('edit existing provider', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();

    await expect(page.getByRole('heading', { name: /编辑 Provider/ })).toBeVisible();
    await expect(page.locator('input[placeholder="openai"]')).toBeDisabled();

    await page.locator('input[placeholder="OpenAI"]').fill('OpenAI Updated');
    await page.getByRole('button', { name: '保存 Provider' }).click();

    await expect(page.getByText('更新成功')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'OpenAI Updated' })).toBeVisible();
  });
});

test.describe('Delete Provider', () => {
  test('delete provider with confirmation', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '删除' }).click();

    await expect(page.getByRole('heading', { name: '确认删除' })).toBeVisible();
    await expect(page.getByText('确定删除 "OpenAI"？此操作不可撤销。')).toBeVisible();

    await page.getByRole('button', { name: '确认删除' }).click();
    await expect(page.getByText('删除成功')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'OpenAI' })).not.toBeVisible();
  });

  test('cancel delete', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '删除' }).click();

    await page.getByRole('button', { name: '取消' }).click();
    await expect(page.getByRole('heading', { name: 'OpenAI' })).toBeVisible();
  });
});

test.describe('Settings', () => {
  test('change thinking level', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click();
    await expect(page.getByRole('heading', { name: '全局设置' })).toBeVisible();

    await page.locator('select').selectOption('high');
    await page.getByRole('button', { name: '保存设置' }).click();

    await expect(page.getByText('保存成功')).toBeVisible();
  });
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
    await page.getByTestId('api-type-select').selectOption('openai-completions');
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
});

test.describe('Preset Model Selection', () => {
  test('select preset and model with alias', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await expect(page.getByRole('heading', { name: '添加 Provider' })).toBeVisible();

    // Select StepFun preset
    await page.getByTestId('preset-select').selectOption('step-plan');

    // Verify preset info auto-filled
    await expect(page.locator('input[placeholder="openai"]')).toHaveValue('step-plan');
    await expect(page.locator('input[placeholder="OpenAI"]')).toHaveValue('StepFun (Step Plan)');

    // Select model from dropdown
    await page.getByTestId('model-select').selectOption('step-3.7-flash');

    // Set alias
    await page.getByTestId('model-alias-input').fill('我的Step模型');

    // Save provider
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Provider 管理' })).toBeVisible();

    // Verify on dashboard
    await expect(page.getByRole('heading', { name: 'StepFun (Step Plan)' })).toBeVisible();

    // Re-edit and verify model alias persisted
    const card = page.getByTestId('provider-card-step-plan');
    await card.getByRole('button', { name: '编辑' }).click();
    await expect(page.getByText('我的Step模型')).toBeVisible();
  });

  test('select preset without model then manual add', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();

    // Select OpenAI preset (no models in mock)
    await page.getByTestId('preset-select').selectOption('openai');
    await expect(page.locator('input[placeholder="openai"]')).toHaveValue('openai');

    // No model dropdown since OpenAI preset has no models
    await expect(page.getByTestId('model-select')).not.toBeVisible();

    // Add model manually
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('gpt-4');
    await page.getByTestId('model-name-input').fill('GPT-4');
    await page.getByTestId('save-model-btn').click();

    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
  });
});

test.describe('Model Configuration', () => {
  test('add model to existing provider', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();

    await expect(page.getByRole('heading', { name: /编辑 Provider/ })).toBeVisible();

    // Click add model
    await page.getByTestId('add-model-btn').click();
    await expect(page.getByTestId('model-editor')).toBeVisible();

    // Fill model form
    await page.getByTestId('model-id-input').fill('gpt-4-turbo');
    await page.getByTestId('model-name-input').fill('GPT-4 Turbo');
    await page.getByTestId('model-context-window').fill('128000');
    await page.getByTestId('model-max-tokens').fill('4096');
    await page.getByTestId('model-reasoning').check();

    // Save model
    await page.getByTestId('save-model-btn').click();
    await expect(page.getByTestId('model-item-gpt-4-turbo')).toBeVisible();
    await expect(page.getByText('GPT-4 Turbo')).toBeVisible();
    await expect(page.getByText('Reasoning')).toBeVisible();

    // Save provider and verify dashboard
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Provider 管理' })).toBeVisible();

    // Re-edit and verify model persisted
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await expect(page.getByTestId('model-item-gpt-4-turbo')).toBeVisible();
  });

  test('edit model config', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();

    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('gpt-4o');
    await page.getByTestId('model-name-input').fill('GPT-4o');
    await page.getByTestId('save-model-btn').click();

    // Edit the model
    await page.getByTestId('edit-model-gpt-4o').click();
    await expect(page.getByTestId('model-editor')).toBeVisible();
    await page.getByTestId('model-name-input').fill('GPT-4o Updated');
    await page.getByTestId('model-context-window').fill('256000');
    await page.getByTestId('save-model-btn').click();

    await expect(page.getByText('GPT-4o Updated')).toBeVisible();
    await expect(page.getByText('Context: 256000')).toBeVisible();

    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功')).toBeVisible();
  });

  test('delete model from provider', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();

    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('temp-model');
    await page.getByTestId('model-name-input').fill('Temp Model');
    await page.getByTestId('save-model-btn').click();

    await expect(page.getByTestId('model-item-temp-model')).toBeVisible();

    await page.getByTestId('delete-model-temp-model').click();
    await expect(page.getByTestId('model-item-temp-model')).not.toBeVisible();

    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功')).toBeVisible();
  });
});

test.describe('App', () => {
  test('dynamic version display', async ({ page }) => {
    await expect(page.getByText('v0.1.2')).toBeVisible();
  });
});
