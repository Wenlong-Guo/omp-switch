import { useState } from "react";

interface KeyValueEditorProps {
  label?: string;
  value?: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}

export default function KeyValueEditor({ label, value: rawValue, onChange }: KeyValueEditorProps) {
  const value = rawValue || {};
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const entries = Object.entries(value);

  const addPair = () => {
    if (!newKey.trim()) {
      setError("Key 不能为空");
      return;
    }
    if (value[newKey.trim()]) {
      setError("Key 已存在");
      return;
    }
    setError(null);
    onChange({ ...value, [newKey.trim()]: newValue });
    setNewKey("");
    setNewValue("");
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
            删除
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
          添加
        </button>
      </div>
      {error && <div className="text-xs text-red-600" data-testid="kv-error">{error}</div>}
    </div>
  );
}
