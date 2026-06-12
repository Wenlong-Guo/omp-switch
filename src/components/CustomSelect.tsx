import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
  testId?: string;
  onChange: (value: string) => void;
}

export default function CustomSelect({ value, options, placeholder, disabled, testId, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative w-full">
      <select
        aria-hidden="true"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="sr-only"
        tabIndex={-1}
        data-testid={testId}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((next) => !next)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#222] bg-black/40 px-4 py-3 text-left text-sm text-white outline-none transition duration-200 hover:border-[#1db7f7]/60 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={selected ? "truncate text-white" : "truncate text-muted-foreground"}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && !disabled && (
        <div className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-[#222] bg-[#050505] p-1 shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-muted-foreground transition hover:bg-[linear-gradient(90deg,#1db7f7,#b600f8)] hover:text-white"
          >
            {placeholder}
            {!value && <Check className="h-4 w-4" />}
          </button>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setOpen(false); }}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-muted-foreground transition hover:bg-[linear-gradient(90deg,#1db7f7,#b600f8)] hover:text-white"
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && <Check className="h-4 w-4 shrink-0 text-white" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
