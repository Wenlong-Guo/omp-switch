import { expect } from '@playwright/test';

// Backend state verification helpers for E2E tests
// Every test MUST call a backend verify function after UI operations
// to ensure the mock (and eventually real) backend state matches expectations.

export async function invokeBackend(page: any, cmd: string, args?: any) {
  return await page.evaluate(async ({ cmd, args }: { cmd: string; args?: any }) => {
    const internals = (window as any).__TAURI_INTERNALS__;
    return await internals.invoke(cmd, args);
  }, { cmd, args });
}

export async function getProviders(page: any) {
  return await invokeBackend(page, 'get_providers');
}

export async function getSettings(page: any) {
  return await invokeBackend(page, 'get_settings');
}

export async function getBuiltinPresets(page: any) {
  return await invokeBackend(page, 'get_builtin_presets');
}

/** Verify a provider exists by id after save/update */
export async function verifyProviderExists(page: any, id: string) {
  const providers = await getProviders(page);
  const found = providers.find((p: any) => p.id === id);
  expect(found).toBeTruthy();
  return found;
}

/** Verify a provider does NOT exist after delete */
export async function verifyProviderDeleted(page: any, id: string) {
  const providers = await getProviders(page);
  const found = providers.find((p: any) => p.id === id);
  expect(found).toBeFalsy();
}

/** Verify defaultProvider in settings */
export async function verifyDefaultProvider(page: any, id: string) {
  const settings = await getSettings(page);
  expect(settings.defaultProvider).toBe(id);
}

/** Verify settings saved correctly */
export async function verifySettings(page: any, expected: any) {
  const settings = await getSettings(page);
  for (const [key, value] of Object.entries(expected)) {
    expect(settings[key]).toBe(value);
  }
}

/** Verify real model call through omp chat_completion */
export async function verifyModelCall(page: any) {
  const result = await invokeBackend(page, 'chat_completion', {
    messages: [{ role: 'user', content: '1+2=?' }],
    model: 'llama3-2',
  });
  expect(result).toBeTruthy();
  expect(result.choices).toBeTruthy();
  expect(result.choices.length).toBeGreaterThan(0);
  expect(result.choices[0].message).toBeTruthy();
  expect(result.choices[0].message.content).toBeTruthy();
}
