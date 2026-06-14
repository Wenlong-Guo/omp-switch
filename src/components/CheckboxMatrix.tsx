import { Fragment } from "react";
import { useI18n } from "@/lib/i18n";

interface CheckboxMatrixProps {
  label?: string;
  value: { input?: string[]; output?: string[] };
  options: string[];
  onChange: (value: { input?: string[]; output?: string[] }) => void;
  disabled?: boolean;
}

export default function CheckboxMatrix({ label, value, options, onChange, disabled }: CheckboxMatrixProps) {
  const { t } = useI18n();
  const inputValues = value.input || [];
  const outputValues = value.output || [];

  const toggle = (direction: 'input' | 'output', option: string) => {
    if (disabled) return;
    const current = direction === 'input' ? inputValues : outputValues;
    const next = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];
    onChange({
      ...value,
      [direction]: next,
    });
  };

  const selectAll = (direction: 'input' | 'output') => {
    if (disabled) return;
    onChange({
      ...value,
      [direction]: [...options],
    });
  };

  const clearAll = (direction: 'input' | 'output') => {
    if (disabled) return;
    onChange({
      ...value,
      [direction]: [],
    });
  };

  return (
    <div className="space-y-2" data-testid="checkbox-matrix">
      {label && <div className="text-sm font-medium">{label}</div>}
      <div className="grid grid-cols-[auto_repeat(5,1fr)] gap-1 text-sm">
        <div></div>
        {options.map((opt) => (
          <div key={opt} className="text-center text-xs text-muted-foreground">{opt}</div>
        ))}
        {['input', 'output'].map((direction) => (
          <Fragment key={direction}>
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium capitalize">{direction}</span>
              <button
                type="button"
                onClick={() => selectAll(direction as 'input' | 'output')}
                className="text-xs text-primary hover:underline disabled:opacity-50"
                disabled={disabled}
                data-testid={`select-all-${direction}`}
              >
                {t("selectAll")}
              </button>
              <button
                type="button"
                onClick={() => clearAll(direction as 'input' | 'output')}
                className="text-xs text-muted-foreground hover:underline disabled:opacity-50"
                disabled={disabled}
                data-testid={`clear-all-${direction}`}
              >
                {t("clearAllLabel")}
              </button>
            </div>
            {options.map((opt) => {
              const checked = (direction === 'input' ? inputValues : outputValues).includes(opt);
              return (
                <div key={`${direction}-${opt}`} className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(direction as 'input' | 'output', opt)}
                    disabled={disabled}
                    data-testid={`${direction}-${opt}`}
                  />
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
