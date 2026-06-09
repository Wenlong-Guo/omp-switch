import { useEffect } from "react";
import { useToastStore } from "@/stores/toastStore";

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
  toast: { id: string; message: string; type: "success" | "error" };
  onRemove: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icon = toast.type === "success" ? "✓" : "✕";

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium border animate-in slide-in-from-right-2 fade-in duration-300 ${
        toast.type === "success"
          ? "bg-background text-green-700 border-green-200 dark:border-green-900 dark:text-green-400"
          : "bg-background text-red-700 border-red-200 dark:border-red-900 dark:text-red-400"
      }`}
      onClick={() => onRemove(toast.id)}
      role="alert"
    >
      <span
        className={`flex items-center justify-center w-5 h-5 rounded-full text-xs text-white ${
          toast.type === "success" ? "bg-green-500" : "bg-red-500"
        }`}
      >
        {icon}
      </span>
      <span>{toast.message}</span>
    </div>
  );
}
