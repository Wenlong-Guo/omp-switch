// Mock Tauri IPC for E2E testing
export function injectTauriMock(page: any) {
  return page.addInitScript(() => {
    const mockProviders = [
      { id: 'openai', name: 'OpenAI', api: 'openai-completions', baseUrl: 'https://api.openai.com/v1', enabled: true, isBuiltIn: false },
      { id: 'anthropic', name: 'Anthropic', api: 'anthropic-messages', baseUrl: 'https://api.anthropic.com', enabled: true, isBuiltIn: false },
    ];

    let providers = [...mockProviders];
    let settings = { defaultProvider: 'openai', defaultModel: 'gpt-4', thinkingLevel: 'medium' };

    (window as any).__TAURI_INTERNALS__ = {
      invoke: async (cmd: string, args?: any) => {
        switch (cmd) {
          case 'get_providers':
            return providers;
          case 'save_provider':
            const existing = providers.findIndex((p: any) => p.id === args.config.id);
            if (existing >= 0) {
              providers[existing] = args.config;
            } else {
              providers.push(args.config);
            }
            return args.config;
          case 'delete_provider':
            providers = providers.filter((p: any) => p.id !== args.id);
            return;
          case 'set_active_provider':
            settings.defaultProvider = args.providerId;
            return;
          case 'get_settings':
            return settings;
          case 'save_settings':
            settings = { ...settings, ...args.settings };
            return;
          case 'get_version':
            return '0.1.2';
          case 'plugin:app|version':
            return '0.1.2';
          default:
            throw new Error(`Unknown command: ${cmd}`);
        }
      },
    };
  });
}
