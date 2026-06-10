import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
});

test.describe('Supplier requirements', () => {
  test('removes sidebar search and footer info', async ({ page }) => {
    await expect(page.getByRole('button', { name: /搜索/ })).not.toBeVisible();
    await expect(page.getByText('AI Provider 配置管理')).not.toBeVisible();
    await expect(page.getByRole('button', { name: '供应商', exact: true })).toBeVisible();
  });

  test('list controls whether provider config is applied', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByTestId('provider-enabled-openai').uncheck();
    await expect(openaiCard.getByText('未应用')).toBeVisible();
    const providers = await page.evaluate(async () => await (window as any).__TAURI_INTERNALS__.invoke('get_providers'));
    expect(providers.find((p: any) => p.id === 'openai').enabled).toBe(false);
  });

  test('model name is optional and defaults to model id', async ({ page }) => {
    await page.getByTestId('provider-card-openai').getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('step-3.7-flash');
    await page.getByTestId('save-model-btn').click();
    await expect(page.getByTestId('model-item-step-3.7-flash')).toBeVisible();
    await expect(page.getByText('step-3.7-flash').first()).toBeVisible();
  });

  test('model metadata defaults enable reasoning and image input', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('gpt-5.5');
    await expect(page.getByTestId('model-reasoning')).toBeChecked();
    await expect(page.getByLabel('图片')).toBeChecked();
    await page.getByRole('button', { name: '成本与限制' }).click();
    await expect(page.getByTestId('model-context-window')).toHaveValue('400000');
    await expect(page.getByTestId('model-max-tokens')).toHaveValue('128000');
  });
});
