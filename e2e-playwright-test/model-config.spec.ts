import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { verifyProviderExists } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
});

test.describe('Model Configuration', () => {
  test('add model to existing provider', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();

    await expect(page.getByRole('heading', { name: /编辑 Provider/ })).toBeVisible();

    // Click add model
    await page.getByTestId('add-model-btn').click();
    await expect(page.getByTestId('model-editor-dialog')).toBeVisible();

    // Fill model form
    await page.getByTestId('model-id-input').fill('gpt-4-turbo');
    await page.getByTestId('model-name-input').fill('GPT-4 Turbo');
    await page.getByRole('button', { name: '成本与限制' }).click();
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

    // Backend verify: model persisted in provider
    let updated = await verifyProviderExists(page, 'openai');
    expect(updated.models.some((m: any) => m.id === 'gpt-4-turbo')).toBe(true);

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
    await expect(page.getByTestId('model-editor-dialog')).toBeVisible();
    await page.getByTestId('model-name-input').fill('GPT-4o Updated');
    await page.getByRole('button', { name: '成本与限制' }).click();
    await page.getByTestId('model-context-window').fill('256000');
    await page.getByTestId('save-model-btn').click();

    await expect(page.getByText('GPT-4o Updated')).toBeVisible();
    await expect(page.getByText('256,000 ctx')).toBeVisible();

    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功')).toBeVisible();

    // Backend verify: model name and contextWindow updated
    const updated = await verifyProviderExists(page, 'openai');
    const model = updated.models.find((m: any) => m.id === 'gpt-4o');
    expect(model.name).toBe('GPT-4o Updated');
    expect(model.contextWindow).toBe(256000);
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

    // Backend verify: model removed from provider
    const updated = await verifyProviderExists(page, 'openai');
    expect(updated.models.some((m: any) => m.id === 'temp-model')).toBe(false);
  });

  test('cancel model edit does not save changes', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();

    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('cancel-model');
    await page.getByTestId('model-name-input').fill('Cancel Model');
    await page.getByTestId('save-model-btn').click();

    await page.getByTestId('edit-model-cancel-model').click();
    await page.getByTestId('model-name-input').fill('Should Not Save');
    await page.getByRole('button', { name: '取消' }).click();

    await expect(page.getByTestId('model-editor-dialog')).not.toBeVisible();
    await expect(page.getByText('Cancel Model')).toBeVisible();
    await expect(page.getByText('Should Not Save')).not.toBeVisible();

    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功')).toBeVisible();

    const saved = await verifyProviderExists(page, 'openai');
    const model = saved.models.find((m: any) => m.id === 'cancel-model');
    expect(model.name).toBe('Cancel Model');
  });

  test('model with zero context window', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();

    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('zero-ctx');
    await page.getByTestId('model-name-input').fill('Zero Context');
    await page.getByRole('button', { name: '成本与限制' }).click();
    await page.getByTestId('model-context-window').fill('0');
    await page.getByTestId('model-max-tokens').fill('100');
    await page.getByTestId('save-model-btn').click();

    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功')).toBeVisible();

    const saved = await verifyProviderExists(page, 'openai');
    const model = saved.models.find((m: any) => m.id === 'zero-ctx');
    expect(model.contextWindow).toBe(0);
    expect(model.maxTokens).toBe(100);
  });

  test('model cost fields persisted', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();

    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('cost-model');
    await page.getByTestId('model-name-input').fill('Cost Model');
    await page.getByRole('button', { name: '成本与限制' }).click();
    await page.getByTestId('model-context-window').fill('128000');
    await page.getByTestId('model-max-tokens').fill('4096');
    await page.getByTestId('save-model-btn').click();

    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功')).toBeVisible();

    const saved = await verifyProviderExists(page, 'openai');
    const model = saved.models.find((m: any) => m.id === 'cost-model');
    expect(model.cost.input).toBe(0);
    expect(model.cost.output).toBe(0);
  });

  test('model name with special characters', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();

    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('special-model');
    await page.getByTestId('model-name-input').fill('Model @#$%^&*()');
    await page.getByTestId('save-model-btn').click();

    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功')).toBeVisible();

    const saved = await verifyProviderExists(page, 'openai');
    const model = saved.models.find((m: any) => m.id === 'special-model');
    expect(model.name).toBe('Model @#$%^&*()');
  });

  test('add multiple models to provider', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();

    for (let i = 1; i <= 3; i++) {
      await page.getByTestId('add-model-btn').click();
      await page.getByTestId('model-id-input').fill(`multi-${i}`);
      await page.getByTestId('model-name-input').fill(`Multi ${i}`);
      await page.getByTestId('save-model-btn').click();
    }

    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功')).toBeVisible();

    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.models.length).toBeGreaterThanOrEqual(3);
  });

  test('refresh page shows persisted models', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();

    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('persist-refresh');
    await page.getByTestId('model-name-input').fill('Persist Refresh');
    await page.getByTestId('save-model-btn').click();

    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功')).toBeVisible();

    await page.reload();
    await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await expect(page.getByTestId('model-item-persist-refresh')).toBeVisible();
  });
});