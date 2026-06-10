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

const initialSettings = { defaultProvider: 'openai', defaultModel: 'gpt-4', defaultThinkingLevel: 'medium' };

function buildInitScript(apiKey: string) {
  const mp = JSON.stringify(mockProviders);
  const bp = JSON.stringify(builtinPresets);
  const is = JSON.stringify(initialSettings);
  return `
    const STORAGE_KEY = '__TAURI_MOCK_STATE__';
    const mockProviders = JSON.parse('${mp.replace(/'/g, "\\'")}');
    const builtinPresets = JSON.parse('${bp.replace(/'/g, "\\'")}');
    const initialSettings = JSON.parse('${is.replace(/'/g, "\\'")}');

    function loadState() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return null;
    }

    function saveState(s) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      window.__TAURI_MOCK_STATE__ = s;
    }

    var state = loadState();
    if (!state) {
      state = {
        providers: JSON.parse(JSON.stringify(mockProviders)),
        builtinPresets: builtinPresets,
        settings: Object.assign({}, initialSettings),
        chatHistory: [],
        syncConfig: null,
      };
      saveState(state);
    } else {
      if (!state.syncConfig) state.syncConfig = null;
      window.__TAURI_MOCK_STATE__ = state;
    }

    window.__resetTauriMock = function() {
      var newState = {
        providers: JSON.parse(JSON.stringify(mockProviders)),
        builtinPresets: builtinPresets,
        settings: Object.assign({}, initialSettings),
        chatHistory: [],
        syncConfig: null,
      };
      saveState(newState);
    };

    window.__TAURI_INTERNALS__ = {
      invoke: async function(cmd, args) {
        var st = loadState() || window.__TAURI_MOCK_STATE__;
        switch (cmd) {
          case 'get_providers':
            return st.providers;
          case 'get_builtin_presets':
            return st.builtinPresets;
          case 'save_provider':
            var existing = st.providers.findIndex(function(p) { return p.id === args.config.id; });
            if (existing >= 0) {
              st.providers[existing] = args.config;
            } else {
              st.providers.push(args.config);
            }
            saveState(st);
            return args.config;
          case 'delete_provider':
            st.providers = st.providers.filter(function(p) { return p.id !== args.id; });
            saveState(st);
            return;
          case 'set_active_provider':
            st.settings.defaultProvider = args.providerId;
            saveState(st);
            return;
          case 'get_settings':
            return Object.assign({}, st.settings);
          case 'save_settings':
            st.settings = Object.assign({}, st.settings, args.settings);
            saveState(st);
            return;
          case 'get_version':
            return '0.1.2';
          case 'plugin:app|version':
          case 'plugin:app|version|none':
            return '0.1.2';
          case 'chat_completion':
            var messages = args.messages;
            var apiKey = '${apiKey.replace(/'/g, "\\'")}';
            var baseUrl = 'https://api.stepfun.com/step_plan/v1';
            var model = 'step-3.7-flash';
            // Use explicit provider_id if provided, otherwise fallback to first configured provider
            var provider = null;
            if (args.provider_id) {
              provider = st.providers.find(function(p) { return p.id === args.provider_id; });
            }
            if (!provider) {
              provider = st.providers.find(function(p) { return p.baseUrl && (p.apiKey || p.id === 'step-plan'); });
            }
            if (provider) {
              if (provider.baseUrl) baseUrl = provider.baseUrl;
              if (provider.apiKey) apiKey = provider.apiKey;
              if (args.model) {
                model = args.model;
              } else if (provider.models && provider.models.length > 0) {
                model = provider.models[0].id;
              }
            }
            if (typeof window.__e2e_http_post === 'function') {
              var result = await window.__e2e_http_post(
                baseUrl + '/chat/completions',
                {
                  'Authorization': 'Bearer ' + apiKey,
                  'Content-Type': 'application/json'
                },
                {
                  model: model,
                  messages: messages.map(function(m) { return { role: m.role, content: m.content }; })
                }
              );
              if (result.status !== 200) {
                throw new Error('Model API returned status ' + result.status);
              }
              if (!result.body || !result.body.choices || !result.body.choices[0]) {
                throw new Error('Invalid model API response');
              }
              st.chatHistory.push({ request: messages, response: result.body });
              saveState(st);
              return result.body;
            } else {
              throw new Error('__e2e_http_post not available: E2E tests must run with Playwright exposeFunction bridge');
            }
          case 'get_sync_config':
            return st.syncConfig;
          case 'save_sync_config':
            st.syncConfig = args.config;
            saveState(st);
            return;
          case 'test_sync_connection':
            return st.syncConfig && st.syncConfig.serverUrl ? true : false;
          case 'trigger_sync':
            return { success: true, message: 'mock sync ' + args.direction };
          case 'auto_sync':
            return { success: true, message: 'mock auto sync' };
          default:
            throw new Error('Unknown command: ' + cmd);
        }
      },
    };
  `;
}

export async function injectTauriMock(page: any) {
  const apiKey = process.env.STEPFUN_API_KEY || '14OqZB8mLPQVLEXveakbFiUOAlmY8JknKdo52iE5eUBNG9wk4O9HqD55By2tnYjKu';

  await page.exposeFunction('__e2e_http_post', async (url: string, headers: any, body: any) => {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return {
      status: response.status,
      body: await response.json().catch(() => null),
    };
  });

  await page.addInitScript(buildInitScript(apiKey));
}
