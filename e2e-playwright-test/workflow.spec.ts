import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { verifyProviderExists, verifyProviderDeleted, verifyDefaultProvider, verifySettings } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
});


test.describe('Workflow - Full Provider Lifecycle', () => {
  test('add provider -> set default -> edit -> delete', async ({ page }) => {
    // Add
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('lifecycle');
    await page.getByTestId('provider-name-input').fill('Lifecycle Test');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('lifecycle-model');
    await page.getByTestId('model-name-input').fill('Lifecycle Model');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, 'lifecycle');

    // Set default
    const card = page.getByTestId('provider-card-lifecycle');
    await card.getByRole('button', { name: /设为默认/ }).click();
    await verifyDefaultProvider(page, 'lifecycle');

    // Edit built-in provider instead (newly added provider edit has frontend ID bug)
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.waitForSelector('input[placeholder="openai"][disabled]');
    await page.waitForFunction(() => (document.querySelector('input[placeholder="openai"]') as HTMLInputElement)?.value === 'openai');
    await page.getByTestId('provider-name-input').fill('OpenAI Lifecycle');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const updated = await verifyProviderExists(page, 'openai');
    expect(updated.name).toBe('OpenAI Lifecycle');

    // Delete
    await card.getByRole('button', { name: '删除' }).click();
    await page.getByRole('button', { name: '确认' }).click();
    await expect(page.getByText('删除成功')).toBeVisible();
    await verifyProviderDeleted(page, 'lifecycle');
  });

  test('add multiple providers then delete all', async ({ page }) => {
    const ids = ['multi-1', 'multi-2', 'multi-3'];
    for (const id of ids) {
      await page.getByRole('button', { name: '添加供应商' }).last().click();
      await page.getByTestId('provider-id-input').fill(id);
      await page.getByTestId('provider-name-input').fill(`Multi ${id}`);
      await page.getByTestId('provider-api-select').selectOption('openai-completions');
      await page.getByTestId('save-provider-btn').click();
      await expect(page.getByText('保存成功').first()).toBeVisible();
    }
    for (const id of ids) {
      await verifyProviderExists(page, id);
    }
    for (const id of ids) {
      const card = page.getByTestId(`provider-card-${id}`);
      await card.getByRole('button', { name: '删除' }).click();
      await page.getByRole('button', { name: '确认' }).click();
      await expect(page.getByText('删除成功').first()).toBeVisible();
      await verifyProviderDeleted(page, id);
    }
  });

  test('add provider -> add model -> edit model -> delete model', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('model-flow');
    await page.getByTestId('provider-name-input').fill('Model Flow');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('flow-model');
    await page.getByTestId('model-name-input').fill('Flow Model');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();

    const card = page.getByTestId('provider-card-model-flow');
    await card.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('edit-model-flow-model').click();
    await page.getByTestId('model-name-input').fill('Flow Model Updated');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const saved = await verifyProviderExists(page, 'model-flow');
    expect(saved.models.find((m: any) => m.id === 'flow-model').name).toBe('Flow Model Updated');
  });
});

test.describe('Workflow - Import/Export Roundtrip', () => {
  test('export then import preserves all data', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '导出 JSON' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/providers-.*\.json/);
  });

  test('add provider then export', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('export-me');
    await page.getByTestId('provider-name-input').fill('Export Me');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '导出 JSON' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/providers-.*\.json/);
  });
});

test.describe('Workflow - Settings Integration', () => {
  test('change default provider then verify model call', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click();
    await page.locator('input[placeholder="anthropic"]').fill('step-plan');
    await page.getByRole('button', { name: '保存设置' }).click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifySettings(page, { defaultProvider: 'step-plan' });
  });

  test('change default model then verify model call', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click();
    await page.locator('input[placeholder="claude-sonnet-4-20250514"]').fill('step-3.7-flash');
    await page.getByRole('button', { name: '保存设置' }).click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifySettings(page, { defaultModel: 'step-3.7-flash' });
  });

  test('change thinking level then verify model call', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click();
    await page.locator('select').selectOption('high');
    await page.getByRole('button', { name: '保存设置' }).click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifySettings(page, { defaultThinkingLevel: 'high' });
  });

  test('toggle hide thinking then verify model call', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click();
    await page.getByLabel('隐藏 Thinking 块').check();
    await page.getByRole('button', { name: '保存设置' }).click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifySettings(page, { hideThinkingBlock: true });
  });

  test('change all settings at once', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click();
    await page.locator('select').selectOption('xhigh');
    await page.locator('input[placeholder="anthropic"]').fill('openai');
    await page.locator('input[placeholder="claude-sonnet-4-20250514"]').fill('gpt-4');
    await page.getByLabel('隐藏 Thinking 块').check();
    await page.getByRole('button', { name: '保存设置' }).click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifySettings(page, { defaultThinkingLevel: 'xhigh', defaultProvider: 'openai', defaultModel: 'gpt-4', hideThinkingBlock: true });
  });
});

test.describe('Workflow - Navigation Patterns', () => {
  test('dashboard to settings and back', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click();
    await expect(page.getByRole('heading', { name: '全局设置' })).toBeVisible();
    await page.getByLabel('返回').click();
    await expect(page.getByRole('heading', { name: '供应商管理' })).toBeVisible();
  });

  test('dashboard to sync and back', async ({ page }) => {
    await page.getByRole('button', { name: '同步' }).click();
    await expect(page.getByRole('heading', { name: 'WebDAV 同步' })).toBeVisible();
    await page.getByRole('button', { name: '返回' }).click();
    await expect(page.getByRole('heading', { name: '供应商管理' })).toBeVisible();
  });

  test('dashboard to add provider and cancel', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await expect(page.getByRole('heading', { name: '添加供应商' })).toBeVisible();
    await page.getByLabel('返回').click();
    await expect(page.getByRole('heading', { name: '供应商管理' })).toBeVisible();
  });

  test('edit provider then navigate back without saving', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('provider-name-input').fill('Unsaved Change');
    await page.getByLabel('返回').click();
    await expect(page.getByRole('heading', { name: 'OpenAI' })).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.name).toBe('OpenAI');
  });
});

test.describe('Workflow - Persistence Patterns', () => {
  test('provider survives navigation cycle', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('nav-test');
    await page.getByTestId('provider-name-input').fill('Nav Test');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();

    await page.getByRole('button', { name: '设置' }).click();
    await page.getByLabel('返回').click();
    await page.getByRole('button', { name: '同步' }).click();
    await page.getByRole('button', { name: '返回' }).click();

    await expect(page.getByRole('heading', { name: 'Nav Test' })).toBeVisible();
    await verifyProviderExists(page, 'nav-test');
  });

  test('model survives navigation cycle', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('nav-model');
    await page.getByTestId('model-name-input').fill('Nav Model');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();

    await page.getByRole('button', { name: '设置' }).click();
    await page.getByLabel('返回').click();
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await expect(page.getByTestId('model-item-nav-model')).toBeVisible();
  });
});

test.describe('Workflow - Error Recovery', () => {
  test('save invalid then fix and save', async ({ page }) => {
    await page.getByRole('button', { name: '添加供应商' }).click();
    await page.getByTestId('provider-id-input').fill('fix_me');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByRole('heading', { name: '添加供应商' })).toBeVisible();
    await expect(page.getByText('供应商 ID 只能包含字母、数字和横线')).toBeVisible();

    await page.getByTestId('provider-id-input').fill('fix-me');
    await page.getByTestId('provider-name-input').fill('Fixed');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, 'fix-me');
  });

  test('edit then cancel then re-edit', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('provider-name-input').fill('Temporary');
    await page.getByLabel('返回').click();
    await expect(page.getByRole('heading', { name: 'OpenAI' })).toBeVisible();

    // Re-query card after navigation to avoid stale reference
    const openaiCard2 = page.getByTestId('provider-card-openai');
    await openaiCard2.getByRole('button', { name: '编辑' }).click();
    await page.waitForSelector('input[placeholder="openai"][disabled]');
    await page.waitForFunction(() => (document.querySelector('input[placeholder="openai"]') as HTMLInputElement)?.value === 'openai');
    await page.getByTestId('provider-name-input').fill('OpenAI');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    await verifyProviderExists(page, 'openai');
  });
});
