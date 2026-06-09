import { useEffect, useState } from "react";
import { useToastStore } from "@/stores/toastStore";
import { CheckCircle, XCircle, X } from "lucide-react";

export default function Toast() {
  const { toasts, remove } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enter = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(enter);
  }, []);

  const handleRemove = () => {
    setVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const icon =
    toast.type === "success" ? (
      <CheckCircle className="w-4 h-4 shrink-0" />
    ) : (
      <XCircle className="w-4 h-4 shrink-0" />
    );

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm text-white min-w-[200px] max-w-sm transition-all duration-300 ${
        visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      } ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
    >
      {icon}
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={handleRemove}
        className="shrink-0 hover:opacity-80"
        aria-label="关闭"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
