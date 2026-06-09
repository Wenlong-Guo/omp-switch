import { useEffect } from "react";

export function useTheme() {
  useEffect(() => {
    // 强制深色主题，忽略用户设置
    document.documentElement.classList.add("dark");
  }, []);
}
