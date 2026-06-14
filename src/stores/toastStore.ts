import { create } from "zustand";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
  undoAction?: () => void;
}

interface ToastStore {
  toasts: Toast[];
  show: (message: string, type?: "success" | "error", undoAction?: () => void) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  show: (message, type = "success", undoAction) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, undoAction }],
    }));
    if (type === "success") {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, undoAction ? 5000 : 1500);
    }
  },
  remove: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
