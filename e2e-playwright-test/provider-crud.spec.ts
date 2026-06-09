import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { verifyProviderExists, verifyProviderDeleted } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test.describe('ProviderEditor', () => {
  test('add provider manually', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await expect(page.getByRole('heading', { name: '添加 Provider' })).toBeVisible();

    await page.locator('input[placeholder="openai"]').fill('test-provider');
    await page.locator('input[placeholder="OpenAI"]').fill('Test Provider');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.locator('input[placeholder="https://api.openai.com/v1"]').fill('https://api.test.com/v1');
    await page.locator('input[type="password"]').fill('test-api-key-123');
    await page.getByTestId('save-provider-btn').click();

    await expect(page.getByText('保存成功')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Provider 管理' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Test Provider' })).toBeVisible();

    // Backend verify: provider persisted
    const saved = await verifyProviderExists(page, 'test-provider');
    expect(saved.name).toBe('Test Provider');
    expect(saved.api).toBe('openai-completions');
  });

  test('edit existing provider', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();

    await expect(page.getByRole('heading', { name: /编辑 Provider/ })).toBeVisible();
    await expect(page.locator('input[placeholder="openai"]')).toBeDisabled();

    await page.locator('input[placeholder="OpenAI"]').fill('OpenAI Updated');
    await page.getByTestId('save-provider-btn').click();

    await expect(page.getByText('更新成功')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'OpenAI Updated' })).toBeVisible();

    // Backend verify: name updated
    const updated = await verifyProviderExists(page, 'openai');
    expect(updated.name).toBe('OpenAI Updated');
  });
});

test.describe('Delete Provider', () => {
  test('delete provider with confirmation', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '删除' }).click();

    await expect(page.getByRole('heading', { name: '确认删除' })).toBeVisible();
    await expect(page.getByText('确定删除 "OpenAI"？此操作不可撤销。')).toBeVisible();

    await page.getByRole('button', { name: '确认' }).click();
    await expect(page.getByText('删除成功')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'OpenAI' })).not.toBeVisible();

    // Backend verify: provider removed
    await verifyProviderDeleted(page, 'openai');
  });

  test('cancel delete', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '删除' }).click();

    await page.getByRole('button', { name: '取消' }).click();
    await expect(page.getByRole('heading', { name: 'OpenAI' })).toBeVisible();

    // Backend verify: provider still exists
    await verifyProviderExists(page, 'openai');
  });
});
