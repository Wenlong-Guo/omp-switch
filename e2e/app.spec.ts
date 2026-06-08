import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
});

test.describe('Dashboard', () => {
  test('dis provider cards and default badge', async ({ page }) => {
    await expect(page.getByText('OpenAI')).toBeVisible();
    await expect(page.getByText('Anthropic')).toBeVisible();
    await expect(page.getByText('默认')).toBeVisible();
    await expect(page.getByText('默认: openai')).toBeVisible();
  });

  test('set active provider', async ({ page }) => {
    const anthropicCard = page.locator('div').filter({ hasText: 'Anthropic' }).first();
    await anthropicCard.getByRole('button', { name: '设为默认' }).click();
    await expect(anthropicCard.getByText('默认')).toBeVisible();
    await expect(page.getByText('默认: anthropic')).toBeVisible();
  });

  test('navigate to add provider', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await expect(page.getByRole('heading', { name: '添加 Provider' })).toBeVisible();
  });
});

test.describe('ProviderEditor', () => {
  test('add provider with preset', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await expect(page.getByRole('heading', { name: '添加 Provider' })).toBeVisible();

    await page.locator('select').selectOption('OpenAI');
    await expect(page.locator('input[name="id"]')).toHaveValue('openai');

    await page.getByPlaceholder('sk-...').fill('test-api-key-123');
    await page.getByRole('button', { name: '保存 Provider' }).click();

    await expect(page.getByText('保存成功')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Provider 管理' })).toBeVisible();
  });

  test('edit existing provider', async ({ page }) => {
    const openaiCard = page.locator('div').filter({ hasText: 'OpenAI' }).first();
    await openaiCard.getByRole('button', { name: '编辑' }).click();

    await expect(page.getByRole('heading', { name: /编辑 Provider/ })).toBeVisible();
    await expect(page.locator('input[name="id"]')).toBeDisabled();

    await page.getByPlaceholder('OpenAI').fill('OpenAI Updated');
    await page.getByRole('button', { name: '保存 Provider' }).click();

    await expect(page.getByText('更新成功')).toBeVisible();
  });
});

test.describe('Delete Provider', () => {
  test('delete provider with confirmation', async ({ page }) => {
    const openaiCard = page.locator('div').filter({ hasText: 'OpenAI' }).first();
    await openaiCard.getByRole('button', { name: '删除' }).click();

    await expect(page.getByRole('heading', { name: '确认删除' })).toBeVisible();
    await expect(page.getByText('确定删除 "OpenAI"？此操作不可撤销。')).toBeVisible();

    await page.getByRole('button', { name: '确认删除' }).click();
    await expect(page.getByText('删除成功')).toBeVisible();
    await expect(page.getByText('OpenAI')).not.toBeVisible();
  });

  test('cancel delete', async ({ page }) => {
    const openaiCard = page.locator('div').filter({ hasText: 'OpenAI' }).first();
    await openaiCard.getByRole('button', { name: '删除' }).click();

    await page.getByRole('button', { name: '取消' }).click();
    await expect(page.getByText('OpenAI')).toBeVisible();
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

test.describe('App', () => {
  test('dynamic version display', async ({ page }) => {
    await expect(page.getByText('v0.1.2')).toBeVisible();
  });
});
