import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { verifySettings } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
});

test.describe('Settings', () => {
  test('change thinking level', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click();
    await expect(page.getByRole('heading', { name: '全局设置' })).toBeVisible();

    await page.locator('select').selectOption('high');
    await page.getByRole('button', { name: '保存设置' }).click();

    await expect(page.getByText('保存成功')).toBeVisible();

    // Backend verify: settings persisted
    await verifySettings(page, { defaultThinkingLevel: 'high' });
  });

  test('set default provider', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click();
    await page.locator('input[placeholder="anthropic"]').fill('step-plan');
    await page.getByRole('button', { name: '保存设置' }).click();
    await expect(page.getByText('保存成功')).toBeVisible();

    await verifySettings(page, { defaultProvider: 'step-plan' });
  });

  test('set default model', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click();
    await page.locator('input[placeholder="claude-sonnet-4-20250514"]').fill('gpt-4o');
    await page.getByRole('button', { name: '保存设置' }).click();
    await expect(page.getByText('保存成功')).toBeVisible();

    await verifySettings(page, { defaultModel: 'gpt-4o' });
  });

  test('toggle hide thinking block', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click();
    await page.getByLabel('隐藏 Thinking 块').check();
    await page.getByRole('button', { name: '保存设置' }).click();
    await expect(page.getByText('保存成功')).toBeVisible();

    await verifySettings(page, { hideThinkingBlock: true });
  });

  test('settings persist after navigation', async ({ page }) => {
    await page.getByRole('button', { name: '设置' }).click();
    await page.locator('select').selectOption('low');
    await page.getByRole('button', { name: '保存设置' }).click();
    await expect(page.getByText('保存成功')).toBeVisible();

    await page.getByLabel('返回').click();
    await expect(page.getByRole('heading', { name: 'Provider 管理' })).toBeVisible();

    await page.getByRole('button', { name: '设置' }).click();
    await expect(page.locator('select')).toHaveValue('low');

    await verifySettings(page, { defaultThinkingLevel: 'low' });
  });

  test('cancel settings does not save', async ({ page }) => {
    const before = await page.evaluate(async () => {
      const internals = (window as any).__TAURI_INTERNALS__;
      return await internals.invoke('get_settings');
    });

    await page.getByRole('button', { name: '设置' }).click();
    await page.locator('select').selectOption('xhigh');
    await page.getByLabel('返回').click();

    const after = await page.evaluate(async () => {
      const internals = (window as any).__TAURI_INTERNALS__;
      return await internals.invoke('get_settings');
    });
    expect(after.defaultThinkingLevel).toBe(before.defaultThinkingLevel);
  });
});
