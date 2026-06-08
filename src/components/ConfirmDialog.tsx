import { useState } from "react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="bg-background rounded-lg shadow-xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-muted"
            disabled={loading}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:opacity-90 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "处理中..." : "确认删除"}
          </button>
        </div>
      </div>
    </div>
  );
}
