import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { verifyProviderExists, verifyModelCall } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
});

test.afterEach(async ({ page }) => {
  await verifyModelCall(page);
});

test.describe('Model Advanced - Create', () => {
  test('add model with max context window', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('max-ctx');
    await page.getByTestId('model-name-input').fill('Max Context');
    await page.getByRole('button', { name: '成本与限制' }).click();
    await page.getByTestId('model-context-window').fill('2000000');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.models.find((m: any) => m.id === 'max-ctx').contextWindow).toBe(2000000);
  });

  test('add model with max tokens', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('max-tok');
    await page.getByTestId('model-name-input').fill('Max Tokens');
    await page.getByRole('button', { name: '成本与限制' }).click();
    await page.getByTestId('model-max-tokens').fill('128000');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.models.find((m: any) => m.id === 'max-tok').maxTokens).toBe(128000);
  });

  test('add model with reasoning enabled', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('reasoning-model');
    await page.getByTestId('model-name-input').fill('Reasoning Model');
    await page.getByTestId('model-reasoning').check();
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.models.find((m: any) => m.id === 'reasoning-model').reasoning).toBe(true);
  });

  test('add model with reasoning disabled', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('no-reason');
    await page.getByTestId('model-name-input').fill('No Reason');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.models.find((m: any) => m.id === 'no-reason').reasoning).toBe(false);
  });

  test('add model with unicode id', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('模型-001');
    await page.getByTestId('model-name-input').fill('Unicode ID Model');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.models.some((m: any) => m.id === '模型-001')).toBe(true);
  });

  test('add model with numeric id', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('123');
    await page.getByTestId('model-name-input').fill('Numeric Model');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.models.some((m: any) => m.id === '123')).toBe(true);
  });

  test('add model with single char id', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('x');
    await page.getByTestId('model-name-input').fill('Single Char');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.models.some((m: any) => m.id === 'x')).toBe(true);
  });

  test('add model with very long name', async ({ page }) => {
    const name = 'M'.repeat(200);
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('long-name-model');
    await page.getByTestId('model-name-input').fill(name);
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.models.find((m: any) => m.id === 'long-name-model').name).toBe(name);
  });

  test('add model with unicode name', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('unicode-model');
    await page.getByTestId('model-name-input').fill('日本語モデル');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.models.find((m: any) => m.id === 'unicode-model').name).toBe('日本語モデル');
  });

  test('add model with emoji name', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('emoji-model');
    await page.getByTestId('model-name-input').fill('Model 🧠🤖');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.models.find((m: any) => m.id === 'emoji-model').name).toBe('Model 🧠🤖');
  });

  test('add model with zero context window', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('zero-ctx');
    await page.getByTestId('model-name-input').fill('Zero Context');
    await page.getByRole('button', { name: '成本与限制' }).click();
    await page.getByTestId('model-context-window').fill('0');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.models.find((m: any) => m.id === 'zero-ctx').contextWindow).toBe(0);
  });

  test('add model with zero max tokens', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('zero-tokens');
    await page.getByTestId('model-name-input').fill('Zero Tokens');
    await page.getByRole('button', { name: '成本与限制' }).click();
    await page.getByTestId('model-max-tokens').fill('0');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.models.find((m: any) => m.id === 'zero-tokens').maxTokens).toBe(0);
  });

  test('add model with cost values', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('cost-model');
    await page.getByTestId('model-name-input').fill('Cost Model');
    await page.getByRole('button', { name: '成本与限制' }).click();
    await page.getByTestId('model-context-window').fill('128000');
    await page.getByTestId('model-max-tokens').fill('4096');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    const model = saved.models.find((m: any) => m.id === 'cost-model');
    expect(model.cost.input).toBe(0);
    expect(model.cost.output).toBe(0);
  });

  test('add multiple models at once', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    for (let i = 1; i <= 5; i++) {
      await page.getByTestId('add-model-btn').click();
      await page.getByTestId('model-id-input').fill(`batch-${i}`);
      await page.getByTestId('model-name-input').fill(`Batch ${i}`);
      await page.getByTestId('save-model-btn').click();
    }
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.models.filter((m: any) => m.id.startsWith('batch-')).length).toBe(5);
  });

  test('add model then cancel dialog', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    // First add a real model so provider has models
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('base-model');
    await page.getByTestId('model-name-input').fill('Base Model');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();

    const before = await verifyProviderExists(page, 'openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('cancel-me');
    await page.getByRole('button', { name: '取消' }).click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const after = await verifyProviderExists(page, 'openai');
    expect(after.models.length).toBe(before.models.length);
  });

  test('add model with alias field', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('alias-model');
    await page.getByTestId('model-name-input').fill('Alias Model');
    const aliasInput = page.locator('input[placeholder="别名"]');
    if (await aliasInput.isVisible().catch(() => false)) {
      await aliasInput.fill('My Alias');
    }
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    await verifyProviderExists(page, 'openai');
  });
});

test.describe('Model Advanced - Edit', () => {
  test('edit model name', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('edit-name');
    await page.getByTestId('model-name-input').fill('Original');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();

    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('edit-model-edit-name').click();
    await page.getByTestId('model-name-input').fill('Renamed');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.models.find((m: any) => m.id === 'edit-name').name).toBe('Renamed');
  });

  test('edit model context window', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('edit-ctx');
    await page.getByTestId('model-name-input').fill('Edit Ctx');
    await page.getByRole('button', { name: '成本与限制' }).click();
    await page.getByTestId('model-context-window').fill('1000');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();

    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('edit-model-edit-ctx').click();
    await page.getByRole('button', { name: '成本与限制' }).click();
    await page.getByTestId('model-context-window').fill('200000');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.models.find((m: any) => m.id === 'edit-ctx').contextWindow).toBe(200000);
  });

  test('edit model max tokens', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('edit-tok');
    await page.getByTestId('model-name-input').fill('Edit Tok');
    await page.getByRole('button', { name: '成本与限制' }).click();
    await page.getByTestId('model-max-tokens').fill('100');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();

    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('edit-model-edit-tok').click();
    await page.getByRole('button', { name: '成本与限制' }).click();
    await page.getByTestId('model-max-tokens').fill('8192');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.models.find((m: any) => m.id === 'edit-tok').maxTokens).toBe(8192);
  });

  test('edit model reasoning toggle', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('edit-reason');
    await page.getByTestId('model-name-input').fill('Edit Reason');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();

    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('edit-model-edit-reason').click();
    await page.getByTestId('model-reasoning').check();
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.models.find((m: any) => m.id === 'edit-reason').reasoning).toBe(true);
  });

  test('edit model cancel keeps old values', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('cancel-edit');
    await page.getByTestId('model-name-input').fill('Cancel Edit');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();

    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('edit-model-cancel-edit').click();
    await page.getByTestId('model-name-input').fill('Should Not Change');
    await page.getByRole('button', { name: '取消' }).click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.models.find((m: any) => m.id === 'cancel-edit').name).toBe('Cancel Edit');
  });
});

test.describe('Model Advanced - Delete', () => {
  test('delete only model from provider', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('only-one');
    await page.getByTestId('model-name-input').fill('Only One');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();

    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('delete-model-only-one').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.models.some((m: any) => m.id === 'only-one')).toBe(false);
  });

  test('delete multiple models one by one', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    for (let i = 1; i <= 3; i++) {
      await page.getByTestId('add-model-btn').click();
      await page.getByTestId('model-id-input').fill(`del-${i}`);
      await page.getByTestId('model-name-input').fill(`Del ${i}`);
      await page.getByTestId('save-model-btn').click();
    }
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();

    await openaiCard.getByRole('button', { name: '编辑' }).click();
    for (let i = 1; i <= 3; i++) {
      await page.getByTestId(`delete-model-del-${i}`).click();
    }
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.models.filter((m: any) => m.id.startsWith('del-')).length).toBe(0);
  });
});
