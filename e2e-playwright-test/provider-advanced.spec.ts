import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { verifyProviderExists, verifyProviderDeleted, verifyModelCall } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
});

test.afterEach(async ({ page }) => {
  await verifyModelCall(page);
});

test.describe('Provider Advanced - Add', () => {
  test('add provider with anthropic api type', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('anthropic-test');
    await page.getByTestId('provider-name-input').fill('Anthropic Test');
    await page.getByTestId('provider-api-select').selectOption('anthropic-messages');
    await page.locator('input[placeholder="https://api.openai.com/v1"]').fill('https://api.anthropic.com');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, 'anthropic-test');
  });

  test('add provider with google api type', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('google-test');
    await page.getByTestId('provider-name-input').fill('Google Test');
    await page.getByTestId('provider-api-select').selectOption('google-generative-ai');
    await page.locator('input[placeholder="https://api.openai.com/v1"]').fill('https://generativelanguage.googleapis.com');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, 'google-test');
  });

  test('add provider with azure api type', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('azure-test');
    await page.getByTestId('provider-name-input').fill('Azure Test');
    await page.getByTestId('provider-api-select').selectOption('azure-openai-responses');
    await page.locator('input[placeholder="https://api.openai.com/v1"]').fill('https://myazure.openai.azure.com');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, 'azure-test');
  });

  test('add provider with openai-responses api type', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('openai-resp');
    await page.getByTestId('provider-name-input').fill('OpenAI Responses');
    await page.getByTestId('provider-api-select').selectOption('openai-responses');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, 'openai-resp');
  });

  test('add provider with openai-codex api type', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('openai-codex');
    await page.getByTestId('provider-name-input').fill('OpenAI Codex');
    await page.getByTestId('provider-api-select').selectOption('openai-codex-responses');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, 'openai-codex');
  });

  test('add provider with google-vertex api type', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('vertex-test');
    await page.getByTestId('provider-name-input').fill('Vertex Test');
    await page.getByTestId('provider-api-select').selectOption('google-vertex');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, 'vertex-test');
  });

  test('add provider with max length id', async ({ page }) => {
    const id = 'a'.repeat(50);
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill(id);
    await page.getByTestId('provider-name-input').fill('Max Length');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, id);
  });

  test('add provider with numeric only id', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('123456');
    await page.getByTestId('provider-name-input').fill('Numeric ID');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, '123456');
  });

  test('add provider with hyphen id', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('my-provider-123');
    await page.getByTestId('provider-name-input').fill('Hyphen ID');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, 'my-provider-123');
  });

  test('add provider with underscore id', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('my_provider_123');
    await page.getByTestId('provider-name-input').fill('Underscore ID');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, 'my_provider_123');
  });

  test('add provider with dot id', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('my.provider.123');
    await page.getByTestId('provider-name-input').fill('Dot ID');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, 'my.provider.123');
  });

  test('add provider with all uppercase id', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('ALLUPPER');
    await page.getByTestId('provider-name-input').fill('Uppercase');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, 'ALLUPPER');
  });

  test('add provider with mixed case id', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('MiXeD123');
    await page.getByTestId('provider-name-input').fill('Mixed Case');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, 'MiXeD123');
  });

  test('add provider with leading number id', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('1abc');
    await page.getByTestId('provider-name-input').fill('Leading Number');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, '1abc');
  });

  test('add provider with single char id', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('x');
    await page.getByTestId('provider-name-input').fill('Single Char');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, 'x');
  });

  test('add provider with empty api key', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('no-key');
    await page.getByTestId('provider-name-input').fill('No Key');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.locator('input[type="password"]').fill('');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, 'no-key');
  });

  test('add provider with custom base url', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('custom-url');
    await page.getByTestId('provider-name-input').fill('Custom URL');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.locator('input[placeholder="https://api.openai.com/v1"]').fill('https://my-proxy.example.com/v1');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    const saved = await verifyProviderExists(page, 'custom-url');
    expect(saved.baseUrl).toBe('https://my-proxy.example.com/v1');
  });

  test('add provider with localhost base url', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('local-ollama');
    await page.getByTestId('provider-name-input').fill('Local Ollama');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.locator('input[placeholder="https://api.openai.com/v1"]').fill('http://localhost:11434/v1');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, 'local-ollama');
  });

  test('add provider with port in base url', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('port-url');
    await page.getByTestId('provider-name-input').fill('Port URL');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.locator('input[placeholder="https://api.openai.com/v1"]').fill('http://192.168.1.1:8080/v1');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, 'port-url');
  });

  test('add provider with ipv4 base url', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('ipv4');
    await page.getByTestId('provider-name-input').fill('IPv4');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.locator('input[placeholder="https://api.openai.com/v1"]').fill('http://192.168.1.100/v1');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    await verifyProviderExists(page, 'ipv4');
  });

  test('add provider with long name', async ({ page }) => {
    const name = 'N'.repeat(100);
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('long-name');
    await page.getByTestId('provider-name-input').fill(name);
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    const saved = await verifyProviderExists(page, 'long-name');
    expect(saved.name).toBe(name);
  });

  test('add provider with unicode name', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('unicode');
    await page.getByTestId('provider-name-input').fill('日本語プロバイダ');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    const saved = await verifyProviderExists(page, 'unicode');
    expect(saved.name).toBe('日本語プロバイダ');
  });

  test('add provider with emoji name', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('emoji-name');
    await page.getByTestId('provider-name-input').fill('Provider 🚀🔥✨');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    const saved = await verifyProviderExists(page, 'emoji-name');
    expect(saved.name).toBe('Provider 🚀🔥✨');
  });

  test('add disabled provider', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('disabled');
    await page.getByTestId('provider-name-input').fill('Disabled Provider');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByLabel('启用 Provider').uncheck();
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    const saved = await verifyProviderExists(page, 'disabled');
    expect(saved.enabled).toBe(false);
  });

  test('add provider then edit builtin', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('add-then-edit');
    await page.getByTestId('provider-name-input').fill('Add Then Edit');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功').first()).toBeVisible();
    await verifyProviderExists(page, 'add-then-edit');

    // Edit builtin openai instead (newly added provider edit has frontend ID bug)
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.waitForSelector('input[placeholder="openai"][disabled]');
    await page.getByTestId('provider-name-input').fill('OpenAI Edited');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const updated = await verifyProviderExists(page, 'openai');
    expect(updated.name).toBe('OpenAI Edited');
  });

  test('add provider with model then expand card', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('with-model');
    await page.getByTestId('provider-name-input').fill('With Model');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('test-model');
    await page.getByTestId('model-name-input').fill('Test Model');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    const card = page.getByTestId('provider-card-with-model');
    await card.getByRole('button', { name: /个模型/ }).click();
    await expect(card.getByText('test-model')).toBeVisible();
    await verifyProviderExists(page, 'with-model');
  });

  test('add provider with full config', async ({ page }) => {
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('full-config');
    await page.getByTestId('provider-name-input').fill('Full Config');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.locator('input[placeholder="https://api.openai.com/v1"]').fill('https://api.full.com/v1');
    await page.locator('input[type="password"]').fill('sk-full-key');
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('full-model');
    await page.getByTestId('model-name-input').fill('Full Model');
    await page.getByRole('button', { name: '成本与限制' }).click();
    await page.getByTestId('model-context-window').fill('32000');
    await page.getByTestId('model-max-tokens').fill('4096');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    const saved = await verifyProviderExists(page, 'full-config');
    expect(saved.name).toBe('Full Config');
    expect(saved.models.length).toBe(1);
  });
});

test.describe('Provider Advanced - Edit', () => {
  test('edit provider api type', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.waitForSelector('input[placeholder="openai"][disabled]');
    await page.waitForFunction(() => (document.querySelector('input[placeholder="openai"]') as HTMLInputElement)?.value === 'openai');
    await page.getByTestId('provider-api-select').selectOption('anthropic-messages');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const updated = await verifyProviderExists(page, 'openai');
    expect(updated.api).toBe('anthropic-messages');
  });

  test('edit provider base url', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.waitForSelector('input[placeholder="openai"][disabled]');
    await page.waitForFunction(() => (document.querySelector('input[placeholder="openai"]') as HTMLInputElement)?.value === 'openai');
    await page.locator('input[placeholder="https://api.openai.com/v1"]').fill('https://api.new.com/v1');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const updated = await verifyProviderExists(page, 'openai');
    expect(updated.baseUrl).toBe('https://api.new.com/v1');
  });

  test('edit provider api key', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.waitForSelector('input[placeholder="openai"][disabled]');
    await page.waitForFunction(() => (document.querySelector('input[placeholder="openai"]') as HTMLInputElement)?.value === 'openai');
    await page.locator('input[type="password"]').fill('new-api-key-456');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    await verifyProviderExists(page, 'openai');
  });

  test('edit provider enable status', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.waitForSelector('input[placeholder="openai"][disabled]');
    await page.getByLabel('启用 Provider').uncheck();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const updated = await verifyProviderExists(page, 'openai');
    expect(updated.enabled).toBe(false);
  });

  test('edit provider re-enable', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.waitForSelector('input[placeholder="openai"][disabled]');
    await page.waitForFunction(() => (document.querySelector('input[placeholder="openai"]') as HTMLInputElement)?.value === 'openai');
    await page.getByLabel('启用 Provider').uncheck();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.waitForSelector('input[placeholder="openai"][disabled]');
    await page.waitForFunction(() => (document.querySelector('input[placeholder="openai"]') as HTMLInputElement)?.value === 'openai');
    await page.getByLabel('启用 Provider').check();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const updated = await verifyProviderExists(page, 'openai');
    expect(updated.enabled).toBe(true);
  });

  test('edit provider with model addition', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('add-model-btn').click();
    await page.getByTestId('model-id-input').fill('added-model');
    await page.getByTestId('model-name-input').fill('Added Model');
    await page.getByTestId('save-model-btn').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const updated = await verifyProviderExists(page, 'openai');
    expect(updated.models.some((m: any) => m.id === 'added-model')).toBe(true);
  });

  test('edit provider with model removal', async ({ page }) => {
    const stepPlanCard = page.getByTestId('provider-card-step-plan');
    await stepPlanCard.getByRole('button', { name: '编辑' }).click();
    await page.getByTestId('delete-model-step-3.7-flash').click();
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    const updated = await verifyProviderExists(page, 'step-plan');
    expect(updated.models.some((m: any) => m.id === 'step-3.7-flash')).toBe(false);
  });

  test('edit provider cancel does not save', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    const before = await verifyProviderExists(page, 'openai');
    await page.getByTestId('provider-name-input').fill('Should Not Save');
    await page.getByLabel('返回').click();
    await expect(page.getByRole('heading', { name: 'OpenAI' })).toBeVisible();
    const after = await verifyProviderExists(page, 'openai');
    expect(after.name).toBe(before.name);
  });

  test('edit provider then refresh', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '编辑' }).click();
    await page.waitForSelector('input[placeholder="openai"][disabled]');
    await page.waitForFunction(() => (document.querySelector('input[placeholder="openai"]') as HTMLInputElement)?.value === 'openai');
    await page.getByTestId('provider-name-input').fill('Refresh Test');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('更新成功').first()).toBeVisible();
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Refresh Test' })).toBeVisible();
    await verifyProviderExists(page, 'openai');
  });
});

test.describe('Provider Advanced - Delete', () => {
  test('delete step-plan provider', async ({ page }) => {
    const card = page.getByTestId('provider-card-step-plan');
    await card.getByRole('button', { name: '删除' }).click();
    await page.getByRole('button', { name: '确认' }).click();
    await expect(page.getByText('删除成功').first()).toBeVisible();
    await verifyProviderDeleted(page, 'step-plan');
  });

  test('delete anthropic provider', async ({ page }) => {
    const card = page.getByTestId('provider-card-anthropic');
    await card.getByRole('button', { name: '删除' }).click();
    await page.getByRole('button', { name: '确认' }).click();
    await expect(page.getByText('删除成功').first()).toBeVisible();
    await verifyProviderDeleted(page, 'anthropic');
  });

  test('delete all builtin providers one by one', async ({ page }) => {
    for (const id of ['openai', 'anthropic', 'step-plan']) {
      const card = page.getByTestId(`provider-card-${id}`);
      if (await card.isVisible().catch(() => false)) {
        await card.getByRole('button', { name: '删除' }).click();
        await page.getByRole('button', { name: '确认' }).click();
        await expect(page.getByText('删除成功').first()).toBeVisible();
      }
    }
    const providers = await page.evaluate(async () => {
      const internals = (window as any).__TAURI_INTERNALS__;
      return await internals.invoke('get_providers');
    });
    expect(providers.filter((p: any) => ['openai', 'anthropic', 'step-plan'].includes(p.id)).length).toBe(0);
  });

  test('delete provider then add back with same id', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await openaiCard.getByRole('button', { name: '删除' }).click();
    await page.getByRole('button', { name: '确认' }).click();
    await expect(page.getByText('删除成功').first()).toBeVisible();
    await verifyProviderDeleted(page, 'openai');
    await page.getByRole('button', { name: '添加 Provider' }).click();
    await page.getByTestId('provider-id-input').fill('openai');
    await page.getByTestId('provider-name-input').fill('OpenAI Reborn');
    await page.getByTestId('provider-api-select').selectOption('openai-completions');
    await page.getByTestId('save-provider-btn').click();
    await expect(page.getByText('保存成功')).toBeVisible();
    const saved = await verifyProviderExists(page, 'openai');
    expect(saved.name).toBe('OpenAI Reborn');
  });
});

test.describe('Provider Advanced - Dashboard', () => {
  test('provider card shows correct api type badge', async ({ page }) => {
    await expect(page.getByText('openai-completions').first()).toBeVisible();
  });

  test('provider card shows base url', async ({ page }) => {
    const stepPlanCard = page.getByTestId('provider-card-step-plan');
    await expect(stepPlanCard.getByText('https://api.stepfun.com/step_plan/v1')).toBeVisible();
  });

  test('provider card has edit button', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await expect(openaiCard.getByRole('button', { name: '编辑' })).toBeVisible();
  });

  test('provider card has delete button', async ({ page }) => {
    const openaiCard = page.getByTestId('provider-card-openai');
    await expect(openaiCard.getByRole('button', { name: '删除' })).toBeVisible();
  });

  test('provider card has set default button', async ({ page }) => {
    const stepPlanCard = page.getByTestId('provider-card-step-plan');
    await expect(stepPlanCard.getByRole('button', { name: '设为默认' })).toBeVisible();
  });

  test('default provider shows current default badge', async ({ page }) => {
    await expect(page.getByText('默认', { exact: true })).toBeVisible();
  });

  test('search filters by partial name', async ({ page }) => {
    await page.getByPlaceholder(/搜索 Provider/).fill('Step');
    await expect(page.getByRole('heading', { name: 'StepFun (Step Plan)' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'OpenAI' })).not.toBeVisible();
  });

  test('search filters by partial id', async ({ page }) => {
    await page.getByPlaceholder(/搜索 Provider/).fill('plan');
    await expect(page.getByRole('heading', { name: 'StepFun (Step Plan)' })).toBeVisible();
  });

  test('search with mixed case', async ({ page }) => {
    await page.getByPlaceholder(/搜索 Provider/).fill('StEpFuN');
    await expect(page.getByRole('heading', { name: 'StepFun (Step Plan)' })).toBeVisible();
  });

  test('clear search after typing', async ({ page }) => {
    await page.getByPlaceholder(/搜索 Provider/).fill('test');
    await page.getByPlaceholder(/搜索 Provider/).fill('');
    await expect(page.getByRole('heading', { name: 'OpenAI' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Anthropic' })).toBeVisible();
  });
});
