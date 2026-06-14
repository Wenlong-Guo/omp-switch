import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useProviderStore } from "@/stores/providerStore";
import { useI18n } from "@/lib/i18n";
import { useLocation } from "wouter";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  type: "provider" | "model";
  title: string;
  subtitle: string;
  path: string;
}

export default function SearchDialog({ open, onClose }: Props) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const { providers } = useProviderStore();

  const items = useMemo(() => {
    const q = query.toLowerCase().trim();
    const all: SearchItem[] = [];
    for (const p of providers) {
      all.push({
        id: p.id,
        type: "provider",
        title: p.name,
        subtitle: `${p.id} · ${p.api ?? "无 API"}`,
        path: `/provider/edit/${p.id}`,
      });
      for (const m of p.models ?? []) {
        all.push({
          id: `${p.id}-${m.id}`,
          type: "model",
          title: m.name,
          subtitle: `模型 · ${m.id} · ${p.name}`,
          path: `/provider/edit/${p.id}`,
        });
      }
    }
    if (!q) return all;
    return all.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q)
    );
  }, [providers, query]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [items.length]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSelect = useCallback(
    (item: SearchItem) => {
      setLocation(item.path);
      onClose();
    },
    [setLocation, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((prev) => (prev + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === "Enter" && items.length > 0) {
        e.preventDefault();
        handleSelect(items[selectedIdx]);
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [items, selectedIdx, onClose, handleSelect]
  );

  useEffect(() => {
    const el = listRef.current?.children[selectedIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      data-testid="search-dialog"
    >
      <div
        className="bg-background rounded-xl shadow-2xl w-full max-w-lg mt-[15vh] mx-4 overflow-hidden animate-in zoom-in-95 duration-150 border"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <svg className="w-5 h-5 text-muted-foreground shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchProviderOrModel")}
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] border rounded bg-muted text-muted-foreground">
            ESC
          </kbd>
        </div>
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {items.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t("noMatchFound")}
            </div>
          )}
          {items.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                idx === selectedIdx ? "bg-primary/10 text-foreground" : "hover:bg-muted/50"
              }`}
            >
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${
                  item.type === "provider"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                }`}
              >
                {item.type === "provider" ? "Provider" : "Model"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.title}</div>
                <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>
              </div>
              {idx === selectedIdx && (
                <kbd className="text-[10px] border rounded px-1 text-muted-foreground shrink-0">
                  ↵
                </kbd>
              )}
            </button>
          ))}
        </div>
        <div className="px-4 py-2 border-t bg-muted/20 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="px-1 border rounded bg-background">↑↓</kbd> {t("selectLabel")}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 border rounded bg-background">↵</kbd> {t("confirm2")}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 border rounded bg-background">esc</kbd> {t("closeLabel")}
          </span>
          <span className="ml-auto">{t("results", { count: items.length })}</span>
        </div>
      </div>
    </div>
  );
}
