// Mock Tauri IPC for E2E testing
export function injectTauriMock(page: any) {
  return page.addInitScript(() => {
    const mockProviders = [
      { id: 'openai', name: 'OpenAI', api: 'openai-completions', baseUrl: 'https://api.openai.com/v1', enabled: true, isBuiltIn: true },
      { id: 'anthropic', name: 'Anthropic', api: 'anthropic-messages', baseUrl: 'https://api.anthropic.com', enabled: true, isBuiltIn: true },
      {
        id: 'step-plan',
        name: 'StepFun (Step Plan)',
        api: 'openai-completions',
        baseUrl: 'https://api.stepfun.com/step_plan/v1',
        enabled: true,
        isBuiltIn: true,
        auth: 'apiKey',
        models: [
          {
            id: 'step-3.7-flash',
            name: 'Step 3.7 Flash',
            api: 'openai-completions',
            reasoning: false,
            input: ['text'],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 4096,
          },
        ],
      },
    ];

    const builtinPresets = [
      { id: 'openai', name: 'OpenAI', api: 'openai-completions', baseUrl: 'https://api.openai.com/v1', enabled: true, isBuiltIn: true, auth: 'apiKey' },
      { id: 'anthropic', name: 'Anthropic', api: 'anthropic-messages', baseUrl: 'https://api.anthropic.com', enabled: true, isBuiltIn: true, auth: 'apiKey' },
      {
        id: 'step-plan',
        name: 'StepFun (Step Plan)',
        api: 'openai-completions',
        baseUrl: 'https://api.stepfun.com/step_plan/v1',
        enabled: true,
        isBuiltIn: true,
        auth: 'apiKey',
        models: [
          { id: 'step-3.7-flash', name: 'Step 3.7 Flash', api: 'openai-completions', reasoning: false, input: ['text'], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 4096 },
          { id: 'step-4.0', name: 'Step 4.0', api: 'openai-completions', reasoning: true, input: ['text', 'image'], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256000, maxTokens: 8192 },
        ],
      },
    ];

    let providers = [...mockProviders];
    let settings = { defaultProvider: 'openai', defaultModel: 'gpt-4', thinkingLevel: 'medium' };
    let chatHistory: any[] = [];

    (window as any).__TAURI_INTERNALS__ = {
      invoke: async (cmd: string, args?: any) => {
        switch (cmd) {
          case 'get_providers':
            return providers;
          case 'get_builtin_presets':
            return builtinPresets;
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
          case 'chat_completion': {
            const { messages } = args;
            const lastMessage = messages[messages.length - 1];
            let response = '3';
            if (lastMessage?.content?.includes('1+2')) {
              response = '3';
            }
            const result = {
              id: 'chatcmpl-mock',
              choices: [{ message: { role: 'assistant', content: response } }],
            };
            chatHistory.push({ request: messages, response: result });
            return result;
          }
          default:
            throw new Error(`Unknown command: ${cmd}`);
        }
      },
    };
  });
}
