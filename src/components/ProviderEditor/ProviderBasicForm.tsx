import type { ProviderConfig, ApiType } from "@/types/provider";
import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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

const PROVIDER_ID_PATTERN = /^[A-Za-z0-9-]+$/;

function Field({ label, children, htmlFor }: { label: string; children: ReactNode; htmlFor?: string }) {
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
  const [showApiKey, setShowApiKey] = useState(false);
  const [showUrlHint, setShowUrlHint] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ id?: string; name?: string; baseUrl?: string }>({});
  const urlHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (urlHintTimer.current) clearTimeout(urlHintTimer.current);
    };
  }, []);

  const update = <K extends keyof ProviderConfig>(key: K, value: ProviderConfig[K]) => {
    onChange({ ...form, [key]: value });
  };

  const setFieldError = (key: "id" | "name" | "baseUrl", value?: string) => {
    setFieldErrors((current) => ({ ...current, [key]: value }));
  };

  const validateProviderId = (value = form.id) => {
    const trimmed = value.trim();
    if (!trimmed) return setFieldError("id", t("providerIdRequired"));
    if (!PROVIDER_ID_PATTERN.test(trimmed)) return setFieldError("id", t("providerIdInvalid"));
    setFieldError("id");
  };

  const validateProviderName = (value = form.name) => {
    setFieldError("name", value.trim() ? undefined : t("providerNameRequired"));
  };

  const validateBaseUrl = (target = form) => {
    setFieldError("baseUrl", target.enabled && !target.baseUrl?.trim() && !target.discovery ? t("baseUrlRequired") : undefined);
  };

  const handleBaseUrlBlur = () => {
    const baseUrl = form.baseUrl?.trim() ?? "";
    const shouldAutoComplete = baseUrl && !/^[a-z][a-z0-9+.-]*:\/\//i.test(baseUrl);
    const nextForm = shouldAutoComplete ? { ...form, baseUrl: `https://${baseUrl}` } : { ...form, baseUrl: baseUrl || undefined };

    if (nextForm.baseUrl !== form.baseUrl) onChange(nextForm);
    validateBaseUrl(nextForm);

    if (shouldAutoComplete) {
      setShowUrlHint(true);
      if (urlHintTimer.current) clearTimeout(urlHintTimer.current);
      urlHintTimer.current = setTimeout(() => setShowUrlHint(false), 2000);
    }
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
          onBlur={(e) => validateProviderId(e.target.value)}
          className="w-full rounded-2xl border border-[#222] bg-black/40 px-4 py-3 text-sm text-white outline-none transition duration-200 placeholder:text-muted-foreground focus:border-[#1db7f7] focus:ring-2 focus:ring-[#1db7f7]/20 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="openai"
          pattern="[A-Za-z0-9-]+"
          title="A-Z, a-z, 0-9, -"
          required
          disabled={isEdit}
          data-testid="provider-id-input"
        />
        {fieldErrors.id && <p className="text-xs text-red-400">{fieldErrors.id}</p>}
      </Field>

      <Field label={t("providerName")} htmlFor={`${id}-name`}>
        <input
          id={`${id}-name`}
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          onBlur={(e) => validateProviderName(e.target.value)}
          className="w-full rounded-2xl border border-[#222] bg-black/40 px-4 py-3 text-sm text-white outline-none transition duration-200 placeholder:text-muted-foreground focus:border-[#1db7f7] focus:ring-2 focus:ring-[#1db7f7]/20"
          placeholder={t("providerNamePlaceholder")}
          required
          data-testid="provider-name-input"
        />
        {fieldErrors.name && <p className="text-xs text-red-400">{fieldErrors.name}</p>}
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
          onBlur={handleBaseUrlBlur}
          className="w-full rounded-2xl border border-[#222] bg-black/40 px-4 py-3 text-sm text-white outline-none transition duration-200 placeholder:text-muted-foreground focus:border-[#1db7f7] focus:ring-2 focus:ring-[#1db7f7]/20"
          placeholder="https://api.openai.com/v1"
        />
        {fieldErrors.baseUrl && <p className="text-xs text-red-400">{fieldErrors.baseUrl}</p>}
        {showUrlHint && <p className="text-xs text-[#1db7f7] transition-opacity duration-300">{t("urlAutoComplete")}</p>}
      </Field>

      <Field label="API Key" htmlFor={`${id}-apikey`}>
        <div className="relative">
          <input
            id={`${id}-apikey`}
            type={showApiKey ? "text" : "password"}
            value={form.apiKey ?? ""}
            onChange={(e) => update("apiKey", e.target.value || undefined)}
            className="w-full rounded-2xl border border-[#222] bg-black/40 px-4 py-3 pr-12 text-sm text-white outline-none transition duration-200 placeholder:text-muted-foreground focus:border-[#b600f8] focus:ring-2 focus:ring-[#b600f8]/20"
            placeholder="sk-..."
          />
          <button
            type="button"
            onClick={() => setShowApiKey((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition duration-200 hover:bg-white/10 hover:text-white"
            aria-label={showApiKey ? t("hidePassword") : t("showPassword")}
            title={showApiKey ? t("hidePassword") : t("showPassword")}
          >
            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
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
