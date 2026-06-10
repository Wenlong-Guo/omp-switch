import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { verifyProviderExists, verifyProviderDeleted } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
});


test.describe('ProviderEditor', () => {
  test('add provider manually', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await expect(page.getByRole('heading', { name: '添加供应商' })).toBeVisible();

    await page.locator('input[placeholder="openai"]').fill('test-provider');
    await page.getByTestId('provider-name-input').fill('Test Provider');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.locator('input[placeholder="https://api.openai.com/v1"]').fill('https://api.test.com/v1');
    await page.locator('input[type="password"]').fill('test-api-key-123');
    await page.getByTestId('save-provider-btn').click();

    await expect(page.getByText('保存成功')).toBeVisible();
    await expect(page.getByRole('heading', { name: '供应商管理' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Test Provider' })).toBeVisible();

    // Backend verify: provider persisted
    const saved = await verifyProviderExists(page, 'test-provider');
    expect(saved.name).toBe('Test Provider');
    expect(saved.api).toBe('openai-completions');
  });

  test('edit existing provider', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();

    await expect(page.getByRole('heading', { name: /编辑供应商/ })).toBeVisible();
    await expect(page.locator('input[placeholder="openai"]')).toBeDisabled();
    await page.waitForFunction(() => (document.querySelector('input[placeholder="openai"]') as HTMLInputElement)?.value === 'openai');

    await page.getByTestId('provider-name-input').fill('OpenAI Updated');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
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

  test('cancel add provider', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await expect(page.getByRole('heading', { name: '添加供应商' })).toBeVisible();

    await page.getByTestId('provider-id-input').fill('cancel-test');
    await page.getByTestId('provider-name-input').fill('Cancel Test');
    await page.getByLabel('返回').click();
    await expect(page.getByRole('heading', { name: '供应商管理' })).toBeVisible();

    await verifyProviderDeleted(page, 'cancel-test');
  });

  test('edit provider and cancel', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('provider-name-input').fill('Should Not Save');
    await page.getByLabel('返回').click();
    await expect(page.getByRole('heading', { name: 'OpenAI' })).toBeVisible();

    const provider = await verifyProviderExists(page, 'openai');
    expect(provider.name).not.toBe('Should Not Save');
  });

  test('duplicate provider id updates existing', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('openai');
    await page.getByTestId('provider-name-input').fill('Updated OpenAI');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText(/保存成功|更新成功/)).toBeVisible();

    const updated = await verifyProviderExists(page, 'openai');
    expect(updated.name).toBe('Updated OpenAI');
  });

  test('very long provider id accepted', async ({ page }) => {
    const longId = 'a'.repeat(100);
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill(longId);
    await page.getByTestId('provider-name-input').fill('Long ID Test');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, longId);
  });

  test('empty provider name rejected', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('empty-name');
    await page.getByTestId('provider-name-input').fill('');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByRole('heading', { name: '添加供应商' })).toBeVisible();
  });

  test('save provider with multiple models', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('multi-model');
    await page.getByTestId('provider-name-input').fill('Multi Model');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');

    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('gpt-4');
    await page.getByTestId('model-name-input').fill('GPT-4');
    await page.getByTestId('save-model-btn').click();

    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('gpt-3.5');
    await page.getByTestId('model-name-input').fill('GPT-3.5');
    await page.getByTestId('save-model-btn').click();

    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();

    const saved = await verifyProviderExists(page, 'multi-model');
    expect(saved.models.length).toBe(2);
    expect(saved.models.some((m: any) => m.id === 'gpt-4')).toBe(true);
    expect(saved.models.some((m: any) => m.id === 'gpt-3.5')).toBe(true);
  });

  test('refresh after add shows new provider', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('refresh-test');
    await page.getByTestId('provider-name-input').fill('Refresh Test');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Refresh Test' })).toBeVisible();
    await verifyProviderExists(page, 'refresh-test');
  });
});
