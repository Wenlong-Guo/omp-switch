import type { ProviderConfig, ApiType } from "@/types/provider";
import { useId } from "react";

const API_TYPES = [
  "openai-completions",
  "openai-responses",
  "openai-codex-responses",
  "azure-openai-responses",
  "anthropic-messages",
  "google-generative-ai",
  "google-vertex",
];

export interface PresetOption {
  id: string;
  name: string;
}

interface Props {
  form: ProviderConfig;
  isEdit: boolean;
  onChange: (form: ProviderConfig) => void;
  presets?: PresetOption[];
  selectedPresetId?: string;
  onPresetChange?: (presetId: string, preset: ProviderConfig | null) => void;
}

function Field({ label, children, htmlFor }: { label: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

export default function ProviderBasicForm({ form, isEdit, onChange, presets, selectedPresetId, onPresetChange }: Props) {
  const id = useId();
  const update = <K extends keyof ProviderConfig>(key: K, value: ProviderConfig[K]) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <div className="space-y-4" data-testid="provider-basic-form">
      {presets && !isEdit && onPresetChange && (
        <Field label="选择预设" htmlFor={`${id}-preset`}>
          <select
            id={`${id}-preset`}
            value={selectedPresetId ?? ""}
            onChange={(e) => onPresetChange(e.target.value, null)}
            data-testid="preset-select"
            className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
          >
            <option value="">手动配置</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
      )}

      <Field label="供应商 ID" htmlFor={`${id}-id`}>
        <input
          id={`${id}-id`}
          value={form.id}
          onChange={(e) => update("id", e.target.value)}
          className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-muted disabled:cursor-not-allowed transition-colors"
          placeholder="openai"
          pattern="[A-Za-z0-9-]+"
          title="只能包含字母、数字和横线"
          required
          disabled={isEdit}
          data-testid="provider-id-input"
        />
      </Field>

      <Field label="显示名称" htmlFor={`${id}-name`}>
        <input
          id={`${id}-name`}
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
          placeholder="默认同步供应商 ID"
          required
          data-testid="provider-name-input"
        />
      </Field>

      <Field label="接口格式" htmlFor={`${id}-api`}>
        <select
          id={`${id}-api`}
          value={form.api ?? "openai-completions"}
          onChange={(e) => update("api", e.target.value ? (e.target.value as ApiType) : undefined)}
          data-testid="provider-api-select"
          className="w-full px-3 py-2 border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
        >
          <option value="openai-completions">OpenAI 兼容格式</option>
          {API_TYPES.filter((t) => t !== "openai-completions").map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </Field>

      <Field label="Base URL" htmlFor={`${id}-baseurl`}>
        <input
          id={`${id}-baseurl`}
          value={form.baseUrl ?? ""}
          onChange={(e) => update("baseUrl", e.target.value || undefined)}
          className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
          placeholder="https://api.openai.com/v1"
        />
      </Field>

      <Field label="API Key" htmlFor={`${id}-apikey`}>
        <input
          id={`${id}-apikey`}
          type="password"
          value={form.apiKey ?? ""}
          onChange={(e) => update("apiKey", e.target.value || undefined)}
          className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
          placeholder="sk-..."
        />
      </Field>

      <div className="flex items-center gap-2 py-1">
        <input
          type="checkbox"
          id={`${id}-enabled`}
          checked={form.enabled}
          onChange={(e) => update("enabled", e.target.checked)}
          className="h-4 w-4 rounded border-primary accent-primary"
        />
        <label htmlFor={`${id}-enabled`} className="text-sm font-medium">应用配置</label>
      </div>
    </div>
  );
}
