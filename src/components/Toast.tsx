import { useToastStore } from "@/stores/toastStore";

export default function Toast() {
  const { toasts, remove } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-2 rounded shadow-lg text-sm text-white transition-opacity ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
          onClick={() => remove(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
