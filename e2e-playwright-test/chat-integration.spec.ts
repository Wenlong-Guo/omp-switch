import { test, expect } from '@playwright/test';
import { injectTauriMock } from './mocks/tauri-mock';
import { invokeBackend, verifyModelCall } from './utils/backend-verify';

test.beforeEach(async ({ page }) => {
  await injectTauriMock(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => { (window as any).__resetTauriMock?.(); });
});

test.afterEach(async ({ page }) => {
  await verifyModelCall(page);
});

test.describe('Chat Integration - Basic', () => {
  test('chat with system message', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello' },
      ],
    });
    expect(result).toBeTruthy();
    expect(result.choices).toBeTruthy();
    expect(result.choices[0].message.role).toBe('assistant');
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with multi-turn conversation', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [
        { role: 'user', content: 'My favorite color is blue.' },
        { role: 'assistant', content: 'Got it, your favorite color is blue.' },
        { role: 'user', content: 'What is my favorite color?' },
      ],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });
});

test.describe('Chat Integration - Model-specific', () => {
  test('chat with ollama model id', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'Hello, who are you?' }],
      model: 'llama3-2',
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat requests have valid id', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'Test' }],
    });
    expect(result.id).toBeTruthy();
    expect(typeof result.id).toBe('string');
  });

  test('chat response has assistant role', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'Say hello' }],
    });
    expect(result.choices[0].message.role).toBe('assistant');
  });

  test('chat response content is non-empty', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'Tell me a joke' }],
    });
    expect(result.choices[0].message.content.length).toBeGreaterThan(0);
  });
});
