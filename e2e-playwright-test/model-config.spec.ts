import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
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
