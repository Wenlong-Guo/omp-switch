import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  variant?: "destructive" | "default";
}

export default function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel,
  variant = "destructive",
}: ConfirmDialogProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="bg-background rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200 border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            variant === "destructive" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          }`}>
            {variant === "destructive" ? <AlertTriangle className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded-md hover:bg-muted text-sm transition-colors"
            disabled={loading}
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-md text-sm transition-opacity disabled:opacity-50 ${
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:opacity-90"
                : "bg-primary text-primary-foreground hover:opacity-90"
            }`}
            disabled={loading}
          >
            {loading ? t("processing") : confirmLabel ?? t("confirm")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
