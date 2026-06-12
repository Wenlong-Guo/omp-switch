import { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function CollapsibleSection({ title, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border rounded" data-testid="collapsible-section">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
        data-testid="collapsible-toggle"
      >
        <span>{title}</span>
        <span>{open ? "▼" : "▶"}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2" data-testid="collapsible-content">
          {children}
        </div>
      )}
    </div>
  );
}
