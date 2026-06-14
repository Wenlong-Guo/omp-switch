import { useEffect, useCallback } from "react";

interface Shortcuts {
  onEscape?: () => void;
  onNew?: () => void;
  onSave?: () => void;
  onSearch?: () => void;
}

export function useKeyboardShortcuts(shortcuts: Shortcuts, deps: React.DependencyList = []) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Cmd/Ctrl + S
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        shortcuts.onSave?.();
        return;
      }

      // Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        shortcuts.onSearch?.();
        return;
      }

      // Cmd/Ctrl + N
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        shortcuts.onNew?.();
        return;
      }

      // Escape
      if (e.key === "Escape") {
        shortcuts.onEscape?.();
        return;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
