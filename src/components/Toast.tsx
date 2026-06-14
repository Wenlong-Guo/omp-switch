import { useEffect } from "react";
import { X } from "lucide-react";
import { useToastStore } from "@/stores/toastStore";
import { useI18n } from "@/lib/i18n";

export default function Toast() {
  const { toasts, remove } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 min-w-[200px]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={remove} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: { id: string; message: string; type: "success" | "error"; undoAction?: () => void };
  onRemove: (id: string) => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    if (toast.type !== "success") return;
    const timer = setTimeout(() => onRemove(toast.id), toast.undoAction ? 5000 : 1500);
    return () => clearTimeout(timer);
  }, [toast.id, toast.type, onRemove]);

  const handleUndo = () => {
    toast.undoAction?.();
    onRemove(toast.id);
  };

  const icon = toast.type === "success" ? "✓" : "✕";

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium border animate-in slide-in-from-right-2 fade-in duration-300 ${
        toast.type === "success"
          ? "bg-background text-green-700 border-green-200 dark:border-green-900 dark:text-green-400"
          : "bg-background text-red-700 border-red-200 dark:border-red-900 dark:text-red-400"
      }`}
      role="alert"
      onClick={() => onRemove(toast.id)}
    >
      <span
        className={`flex items-center justify-center w-5 h-5 rounded-full text-xs text-white ${
          toast.type === "success" ? "bg-green-500" : "bg-red-500"
        }`}
      >
        {icon}
      </span>
      <span className="flex-1">{toast.message}</span>
      {toast.undoAction && (
        <button
          type="button"
          onClick={handleUndo}
          className="ml-2 text-xs font-semibold underline underline-offset-2 hover:opacity-80"
        >
          {t("undo")}
        </button>
      )}
      {toast.type === "error" && (
        <button
          type="button"
          onClick={() => onRemove(toast.id)}
          className="ml-1 rounded p-0.5 hover:bg-muted"
          aria-label={t("closeLabel")}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
