import type { ProviderConfig, ApiType } from "@/types/provider";
import { useId } from "react";
import { useI18n } from "@/lib/i18n";

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
      <label htmlFor={htmlFor} className="block text-sm font-medium text-white">{label}</label>
      {children}
    </div>
  );
}

export default function ProviderBasicForm({ form, isEdit, onChange, presets, selectedPresetId, onPresetChange }: Props) {
  const { t } = useI18n();
  const id = useId();
  const update = <K extends keyof ProviderConfig>(key: K, value: ProviderConfig[K]) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <div className="space-y-4" data-testid="provider-basic-form">
      {presets && !isEdit && onPresetChange && (
        <Field label={t("selectPreset")} htmlFor={`${id}-preset`}>
          <select
            id={`${id}-preset`}
            value={selectedPresetId ?? ""}
            onChange={(e) => onPresetChange(e.target.value, null)}
            data-testid="preset-select"
            className="w-full rounded-2xl border border-[#222] bg-black/40 px-4 py-3 text-sm text-white outline-none transition duration-200 focus:border-[#1db7f7] focus:ring-2 focus:ring-[#1db7f7]/20"
          >
            <option value="">{t("manualConfig")}</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
      )}

      <Field label={t("providerId")} htmlFor={`${id}-id`}>
        <input
          id={`${id}-id`}
          value={form.id}
          onChange={(e) => update("id", e.target.value)}
          className="w-full rounded-2xl border border-[#222] bg-black/40 px-4 py-3 text-sm text-white outline-none transition duration-200 placeholder:text-muted-foreground focus:border-[#1db7f7] focus:ring-2 focus:ring-[#1db7f7]/20 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="openai"
          pattern="[A-Za-z0-9-]+"
          title="A-Z, a-z, 0-9, -"
          required
          disabled={isEdit}
          data-testid="provider-id-input"
        />
      </Field>

      <Field label={t("providerName")} htmlFor={`${id}-name`}>
        <input
          id={`${id}-name`}
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className="w-full rounded-2xl border border-[#222] bg-black/40 px-4 py-3 text-sm text-white outline-none transition duration-200 placeholder:text-muted-foreground focus:border-[#1db7f7] focus:ring-2 focus:ring-[#1db7f7]/20"
          placeholder={t("providerNamePlaceholder")}
          required
          data-testid="provider-name-input"
        />
      </Field>

      <Field label={t("apiFormat")} htmlFor={`${id}-api`}>
        <select
          id={`${id}-api`}
          value={form.api ?? "openai-completions"}
          onChange={(e) => update("api", e.target.value ? (e.target.value as ApiType) : undefined)}
          data-testid="provider-api-select"
          className="w-full rounded-2xl border border-[#222] bg-black/40 px-4 py-3 text-sm text-white outline-none transition duration-200 focus:border-[#1db7f7] focus:ring-2 focus:ring-[#1db7f7]/20"
        >
          <option value="openai-completions">{t("apiCompatible")}</option>
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
          className="w-full rounded-2xl border border-[#222] bg-black/40 px-4 py-3 text-sm text-white outline-none transition duration-200 placeholder:text-muted-foreground focus:border-[#1db7f7] focus:ring-2 focus:ring-[#1db7f7]/20"
          placeholder="https://api.openai.com/v1"
        />
      </Field>

      <Field label="API Key" htmlFor={`${id}-apikey`}>
        <input
          id={`${id}-apikey`}
          type="password"
          value={form.apiKey ?? ""}
          onChange={(e) => update("apiKey", e.target.value || undefined)}
          className="w-full rounded-2xl border border-[#222] bg-black/40 px-4 py-3 text-sm text-white outline-none transition duration-200 placeholder:text-muted-foreground focus:border-[#b600f8] focus:ring-2 focus:ring-[#b600f8]/20"
          placeholder="sk-..."
        />
      </Field>

      <div className="flex items-center gap-2 py-1">
        <input
          type="checkbox"
          id={`${id}-enabled`}
          checked={form.enabled}
          onChange={(e) => update("enabled", e.target.checked)}
          className="h-4 w-4 rounded accent-[#1db7f7]"
        />
        <label htmlFor={`${id}-enabled`} className="text-sm font-medium text-white">{t("applyConfig")}</label>
      </div>
    </div>
  );
}
