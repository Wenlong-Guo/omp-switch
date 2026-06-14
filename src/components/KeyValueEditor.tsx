import { useState } from "react";
import { useI18n } from "@/lib/i18n";

interface KeyValueEditorProps {
  label?: string;
  value?: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}

export default function KeyValueEditor({ label, value: rawValue, onChange }: KeyValueEditorProps) {
  const { t } = useI18n();
  const value = rawValue || {};
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [bulkJson, setBulkJson] = useState("");
  const [error, setError] = useState<string | null>(null);

  const entries = Object.entries(value);

  const addPair = () => {
    if (!newKey.trim()) {
      setError(t("keyRequired"));
      return;
    }
    if (value[newKey.trim()]) {
      setError(t("keyExists"));
      return;
    }
    setError(null);
    onChange({ ...value, [newKey.trim()]: newValue });
    setNewKey("");
    setNewValue("");
  };

  const importBulkJson = () => {
    try {
      const parsed = JSON.parse(bulkJson);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") return;
      const additions = Object.fromEntries(
        Object.entries(parsed).map(([key, val]) => [key, typeof val === "string" ? val : JSON.stringify(val)])
      );
      setError(null);
      onChange({ ...value, ...additions });
      setBulkJson("");
    } catch {
      setError(t("importFailed"));
    }
  };

  const removePair = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  const updateValue = (key: string, val: string) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="space-y-2" data-testid="keyvalue-editor">
      {label && <div className="text-sm font-medium">{label}</div>}
      {entries.map(([k, v]) => (
        <div key={k} className="flex gap-2 items-center">
          <input
            value={k}
            readOnly
            className="flex-1 px-2 py-1 border rounded text-sm bg-muted"
            data-testid={`kv-key-${k}`}
          />
          <input
            value={v}
            onChange={(e) => updateValue(k, e.target.value)}
            className="flex-1 px-2 py-1 border rounded text-sm"
            data-testid={`kv-value-${k}`}
          />
          <button
            type="button"
            onClick={() => removePair(k)}
            className="text-sm px-2 py-1 border rounded hover:bg-destructive hover:text-destructive-foreground"
            data-testid={`kv-remove-${k}`}
          >
            {t("removeLabel")}
          </button>
        </div>
      ))}
      <div className="flex gap-2 items-center">
        <input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="Key"
          className="flex-1 px-2 py-1 border rounded text-sm"
          data-testid="kv-new-key"
        />
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Value"
          className="flex-1 px-2 py-1 border rounded text-sm"
          data-testid="kv-new-value"
        />
        <button
          type="button"
          onClick={addPair}
          className="text-sm px-3 py-1 border rounded bg-secondary hover:opacity-90"
          data-testid="kv-add"
        >
          {t("addLabel")}
        </button>
      </div>
      <div className="space-y-1">
        <div className="text-xs font-medium text-muted-foreground">{t("pasteJsonBulk")}</div>
        <textarea
          value={bulkJson}
          onChange={(e) => setBulkJson(e.target.value)}
          placeholder={t("pasteJsonHere")}
          rows={3}
          className="w-full px-2 py-1 border rounded text-xs font-mono"
          data-testid="kv-bulk-json"
        />
        <button
          type="button"
          onClick={importBulkJson}
          className="text-sm px-3 py-1 border rounded bg-secondary hover:opacity-90"
          data-testid="kv-import-bulk"
        >
          {t("importJsonBulk")}
        </button>
      </div>
      {error && <div className="text-xs text-red-600" data-testid="kv-error">{error}</div>}
    </div>
  );
}
