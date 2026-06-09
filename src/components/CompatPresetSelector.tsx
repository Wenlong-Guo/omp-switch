import { COMPAT_PRESETS, applyCompatPreset } from "@/lib/modelAttributes";

interface CompatPresetSelectorProps {
  onApply: (preset: Record<string, unknown>) => void;
  onClear: () => void;
}

export default function CompatPresetSelector({ onApply, onClear }: CompatPresetSelectorProps) {
  return (
    <div className="flex items-center gap-2" data-testid="compat-preset-selector">
      <span className="text-sm text-muted-foreground">快速预设:</span>
      <select
        onChange={(e) => {
          const val = e.target.value;
          if (!val) return;
          if (val === "__clear__") {
            onClear();
          } else {
            const preset = applyCompatPreset(val);
            if (preset) onApply(preset);
          }
        }}
        className="text-sm px-2 py-1 border rounded"
        data-testid="compat-preset-select"
      >
        <option value="">选择预设</option>
        {COMPAT_PRESETS.map((p) => (
          <option key={p.name} value={p.name}>
            {p.label}
          </option>
        ))}
        <option value="__clear__">清空</option>
      </select>
    </div>
  );
}
