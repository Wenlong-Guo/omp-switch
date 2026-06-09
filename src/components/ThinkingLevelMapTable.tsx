import { useState } from "react";
import { THINKING_LEVELS } from "@/lib/modelAttributes";

type LevelState = "inherit" | "custom" | "unsupported";

interface ThinkingLevelMapTableProps {
  value?: Record<string, string | null>;
  onChange: (value: Record<string, string | null>) => void;
}

export default function ThinkingLevelMapTable({ value = {}, onChange }: ThinkingLevelMapTableProps) {
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  const getState = (level: string): LevelState => {
    if (!(level in value)) return "inherit";
    if (value[level] === null) return "unsupported";
    return "custom";
  };

  const setState = (level: string, state: LevelState) => {
    if (state === "inherit") {
      const next = { ...value };
      delete next[level];
      onChange(next);
    } else if (state === "unsupported") {
      onChange({ ...value, [level]: null });
    } else {
      onChange({ ...value, [level]: customValues[level] || "" });
    }
  };

  const setCustom = (level: string, val: string) => {
    setCustomValues((prev) => ({ ...prev, [level]: val }));
    if (getState(level) === "custom") {
      onChange({ ...value, [level]: val });
    }
  };

  return (
    <div className="space-y-1" data-testid="thinking-level-table">
      <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground">
        <div>级别</div>
        <div>继承</div>
        <div>自定义</div>
        <div>不支持</div>
      </div>
      {THINKING_LEVELS.map((level) => {
        const state = getState(level);
        return (
          <div key={level} className="grid grid-cols-4 gap-2 items-center text-sm">
            <div className="capitalize" data-testid={`tl-level-${level}`}>{level}</div>
            <div className="flex justify-center">
              <input
                type="radio"
                name={`tl-${level}`}
                checked={state === "inherit"}
                onClick={() => setState(level, "inherit")}
                readOnly
                data-testid={`tl-inherit-${level}`}
              />
            </div>
            <div className="flex items-center gap-1">
              <input
                type="radio"
                name={`tl-${level}`}
                checked={state === "custom"}
                onClick={() => setState(level, "custom")}
                readOnly
                data-testid={`tl-custom-${level}`}
              />
              <input
                value={customValues[level] || (value[level] as string) || ""}
                onChange={(e) => setCustom(level, e.target.value)}
                disabled={state !== "custom"}
                className="w-full px-1 py-0.5 border rounded text-xs disabled:bg-muted"
                data-testid={`tl-custom-input-${level}`}
              />
            </div>
            <div className="flex justify-center">
              <input
                type="radio"
                name={`tl-${level}`}
                checked={state === "unsupported"}
                onClick={() => setState(level, "unsupported")}
                readOnly
                data-testid={`tl-unsupported-${level}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
