const mockProviders = [
  { id: 'openai', name: 'OpenAI', api: 'openai-completions', baseUrl: 'https://api.openai.com/v1', enabled: true, isBuiltIn: true },
  { id: 'anthropic', name: 'Anthropic', api: 'anthropic-messages', baseUrl: 'https://api.anthropic.com', enabled: true, isBuiltIn: true },
  { id: 'llama-cpp', name: 'Llama CPP', api: 'openai-completions', baseUrl: 'http://localhost:8080/v1', enabled: true, isBuiltIn: true, auth: 'none' },
  { id: 'lm-studio', name: 'LM Studio', api: 'openai-completions', baseUrl: 'http://localhost:1234/v1', enabled: true, isBuiltIn: true, auth: 'none' },
  {
    id: 'ollama',
    name: 'Ollama',
    api: 'openai-completions',
    baseUrl: 'http://localhost:11434',
    enabled: true,
    isBuiltIn: true,
    auth: 'none',
    models: [
      { id: 'llama3-2', name: 'Llama 3.2', api: 'openai-completions', reasoning: false, input: ['text'], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 4096 },
    ],
  },
];

const builtinPresets = [
  { id: 'openai', name: 'OpenAI', api: 'openai-completions', baseUrl: 'https://api.openai.com/v1', enabled: true, isBuiltIn: true, auth: 'apiKey' },
  { id: 'anthropic', name: 'Anthropic', api: 'anthropic-messages', baseUrl: 'https://api.anthropic.com', enabled: true, isBuiltIn: true, auth: 'apiKey' },
  { id: 'llama-cpp', name: 'Llama CPP', api: 'openai-completions', baseUrl: 'http://localhost:8080/v1', enabled: true, isBuiltIn: true, auth: 'none' },
  { id: 'lm-studio', name: 'LM Studio', api: 'openai-completions', baseUrl: 'http://localhost:1234/v1', enabled: true, isBuiltIn: true, auth: 'none' },
  {
    id: 'ollama',
    name: 'Ollama',
    api: 'openai-completions',
    baseUrl: 'http://localhost:11434',
    enabled: true,
    isBuiltIn: true,
    auth: 'none',
    models: [
      { id: 'llama3-2', name: 'Llama 3.2', api: 'openai-completions', reasoning: false, input: ['text'], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 4096 },
      { id: 'qwen2.5', name: 'Qwen 2.5', api: 'openai-completions', reasoning: false, input: ['text'], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 32768, maxTokens: 4096 },
    ],
  },
];

const initialSettings = { defaultProvider: 'openai', defaultModel: 'gpt-4', defaultThinkingLevel: 'medium' };

function buildInitScript() {
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
            return '0.1.3';
          case 'plugin:app|version':
          case 'plugin:app|version|none':
            return '0.1.3';
          case 'chat_completion':
            var messages = args.messages;
            var model = 'llama3-2';
            // Use explicit provider_id if provided, otherwise fallback to first configured provider
            var provider = null;
            if (args.provider_id) {
              provider = st.providers.find(function(p) { return p.id === args.provider_id; });
            }
            if (!provider) {
              provider = st.providers.find(function(p) { return p.baseUrl && p.apiKey; });
            }
            if (args.model) {
              model = args.model;
            } else if (provider && provider.models && provider.models.length > 0) {
              model = provider.models[0].id;
            }
            var response = {
              id: 'mock-chat-' + Date.now(),
              object: 'chat.completion',
              model: model,
              choices: [
                {
                  index: 0,
                  message: { role: 'assistant', content: 'Mock answer: 1+2=3' },
                  finish_reason: 'stop'
                }
              ]
            };
            st.chatHistory.push({ request: messages, response: response });
            saveState(st);
            return response;
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
  await page.addInitScript(buildInitScript());
}
