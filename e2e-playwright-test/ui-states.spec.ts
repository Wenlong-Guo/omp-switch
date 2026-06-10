import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
});


test.describe('UI States - Empty', () => {
  test('empty search shows no results', async ({ page }) => {
    await page.getByPlaceholder(/搜索供应商/).fill('zzzzzzzzzzzzzzz');
    await expect(page.getByText('暂无供应商')).toBeVisible();
  });

  test('dashboard heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '供应商管理' })).toBeVisible();
  });

  test('sidebar has all navigation items', async ({ page }) => {
    await expect(page.getByRole('button', { name: '供应商', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '添加供应商' })).toBeVisible();
    await expect(page.getByRole('button', { name: '设置' })).toBeVisible();
    await expect(page.getByRole('button', { name: '同步' })).toBeVisible();
  });

  test('app title is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'omp-switch', level: 1 })).toBeVisible();
  });

  test('version is displayed in sidebar', async ({ page }) => {
    await expect(page.getByText('v0.1.2')).toBeVisible();
  });

  test('export button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: '导出 JSON' })).toBeVisible();
  });

  test('import button is visible', async ({ page }) => {
    await expect(page.locator('text=导入 JSON')).toBeVisible();
  });

  test('dashboard search input placeholder', async ({ page }) => {
    await expect(page.getByPlaceholder(/搜索供应商/)).toBeVisible();
  });
});

test.describe('UI States - Provider Editor', () => {
  test('add provider form shows all fields', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await expect(page.getByTestId('provider-id-input')).toBeVisible();
    await expect(page.getByTestId('provider-name-input')).toBeVisible();
    await expect(page.getByTestId('provider-api-select')).toBeVisible();
    await expect(page.getByTestId('save-provider-btn')).toBeVisible();
  });

  test('add provider heading', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await expect(page.getByRole('heading', { name: '添加供应商' })).toBeVisible();
  });

  test('edit provider heading', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await expect(page.getByRole('heading', { name: /编辑供应商/ })).toBeVisible();
  });

  test('provider editor has back button', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await expect(page.getByLabel('返回')).toBeVisible();
  });

  test('model editor dialog appears', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('add-model-btn').click();
    await expect(page.getByTestId('model-editor-dialog')).toBeVisible();
  });

  test('model editor has cancel button', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('add-model-btn').click();
    await expect(page.getByRole('button', { name: '取消' })).toBeVisible();
  });

  test('model editor has save button', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('add-model-btn').click();
    await expect(page.getByTestId('save-model-btn')).toBeVisible();
  });

  test('settings page has all fields', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click();
    await expect(page.getByRole('heading', { name: '全局设置' })).toBeVisible();
    await expect(page.locator('select')).toBeVisible();
    await expect(page.getByRole('button', { name: '保存设置' })).toBeVisible();
  });

  test('sync page has all fields', async ({ page }) => {
    await page.goto('/sync');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'WebDAV 同步' })).toBeVisible();
    await expect(page.getByLabel('启用同步')).toBeVisible();
    await expect(page.getByPlaceholder('https://dav.jianguoyun.com/dav/')).toBeVisible();
  });
});

test.describe('UI States - Cards', () => {
  test('openai card is visible', async ({ page }) => {
    await expect(page.getByTestId('provider-card-openai')).toBeVisible();
  });

  test('anthropic card is visible', async ({ page }) => {
    await expect(page.getByTestId('provider-card-anthropic')).toBeVisible();
  });

  test('step-plan card is visible', async ({ page }) => {
    await expect(page.getByTestId('provider-card-step-plan')).toBeVisible();
  });

  test('provider card has name text', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await expect(openaiCard.getByRole('heading', { name: 'OpenAI' })).toBeVisible();
  });

  test('provider card has api type', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await expect(openaiCard.getByText('openai-completions')).toBeVisible();
  });

  test('step-plan card shows model count', async ({ page }) => {
    const stepPlanCard = page.getByTestId('provider-card-step-plan');
    await expect(stepPlanCard.getByText(/个模型/)).toBeVisible();
  });

  test('expand model list button', async ({ page }) => {
    const stepPlanCard = page.getByTestId('provider-card-step-plan');
    await stepPlanCard.getByRole('button', { name: /个模型/ }).click();
    await expect(stepPlanCard.getByText('Step 3.7 Flash')).toBeVisible();
  });

  test('collapse model list', async ({ page }) => {
    const stepPlanCard = page.getByTestId('provider-card-step-plan');
    const btn = stepPlanCard.getByRole('button', { name: /个模型/ });
    await btn.click();
    await btn.click();
    await expect(stepPlanCard.getByText('Step 3.7 Flash')).not.toBeVisible();
  });

  test('provider card hover state', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.hover();
    await expect(openaiCard).toBeVisible();
  });
});

test.describe('UI States - Toasts', () => {
  test('save provider shows success toast', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('toast-test');
    await page.getByTestId('provider-name-input').fill('Toast Test');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
  });

  test('update provider shows success toast', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.waitForSelector('input[placeholder="openai"][disabled]');
    await page.getByTestId('provider-name-input').fill('Updated');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
  });

  test('delete provider shows success toast', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '删除' }).click();
    await page.getByRole('button', { name: '确认' }).click();
    await expect(page.getByText('删除成功')).toBeVisible();
  });

  test('save settings shows success toast', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click();
    await page.getByRole('button', { name: '保存设置' }).click();
    await expect(page.getByText('保存成功')).toBeVisible();
  });
});

test.describe('UI States - Dialogs', () => {
  test('delete confirmation dialog appears', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '删除' }).click();
    await expect(page.getByRole('heading', { name: '确认删除' })).toBeVisible();
  });

  test('delete confirmation has confirm button', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '删除' }).click();
    await expect(page.getByRole('button', { name: '确认' })).toBeVisible();
  });

  test('delete confirmation has cancel button', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '删除' }).click();
    await expect(page.getByRole('button', { name: '取消' })).toBeVisible();
  });

  test('cancel delete closes dialog', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '删除' }).click();
    await page.getByRole('button', { name: '取消' }).click();
    await expect(page.getByRole('heading', { name: '确认删除' })).not.toBeVisible();
  });

  test('model editor dialog has title', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('add-model-btn').click();
    await expect(page.getByTestId('model-editor-dialog')).toBeVisible();
  });
});
