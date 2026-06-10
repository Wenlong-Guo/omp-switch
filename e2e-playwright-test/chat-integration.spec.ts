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

  test('chat with single user message', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'What is 10 * 10?' }],
    });
    expect(result).toBeTruthy();
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

  test('chat with Chinese question', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: '中国的首都是哪里？' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with Japanese question', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: '日本の首都はどこですか？' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with English question', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'What is the capital of France?' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with math question', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'Calculate 123 * 456' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with code question', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'Write a hello world in Python' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with empty user message', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: '' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with very long user message', async ({ page }) => {
    const longMessage = 'Hello '.repeat(500);
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: longMessage }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with special characters', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: '@#$%^&*()_+{}|:<>?~`' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with emoji message', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'Hello 🌍🚀🔥' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with markdown syntax', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: '# Hello\n\nThis is **bold** and *italic*.' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with code block', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: '```python\nprint(1)\n```' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with json content', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: '{"key": "value", "num": 123}' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with xml content', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: '<root><item>test</item></root>' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });
});

test.describe('Chat Integration - Multi-message', () => {
  test('chat with 3 messages', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [
        { role: 'system', content: 'Be concise.' },
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello!' },
        { role: 'user', content: 'How are you?' },
      ],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with 5 messages', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [
        { role: 'system', content: 'You are a math tutor.' },
        { role: 'user', content: 'Teach me addition' },
        { role: 'assistant', content: 'Addition combines two numbers.' },
        { role: 'user', content: 'Give an example' },
        { role: 'assistant', content: '2 + 2 = 4' },
        { role: 'user', content: 'Thanks' },
      ],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with only assistant message history', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [
        { role: 'assistant', content: 'Previous response' },
        { role: 'user', content: 'Continue' },
      ],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });
});

test.describe('Chat Integration - Model-specific', () => {
  test('chat with stepfun model id', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'Hello, who are you?' }],
      model: 'step-3.7-flash',
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

  test('chat with temperature question', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'What is the weather like today?' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with creative writing prompt', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'Write a haiku about programming' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with translation request', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'Translate "Hello" to Chinese' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with summarization request', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'Summarize: The quick brown fox jumps over the lazy dog.' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with reasoning question', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'If A > B and B > C, is A > C?' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with historical fact', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'When did World War II end?' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with science question', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'What is photosynthesis?' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with technology question', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'What is machine learning?' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with philosophy question', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'What is consciousness?' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with cooking question', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'How do I make scrambled eggs?' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with travel question', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'What are top attractions in Paris?' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with health question', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'What are the benefits of exercise?' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with business question', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'What is ROI?' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with language learning', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'Teach me 5 Spanish phrases' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });

  test('chat with programming debug', async ({ page }) => {
    const result = await invokeBackend(page, 'chat_completion', {
      messages: [{ role: 'user', content: 'Fix this: console.log("Hello"' }],
    });
    expect(result).toBeTruthy();
    expect(result.choices[0].message.content).toBeTruthy();
  });
});
