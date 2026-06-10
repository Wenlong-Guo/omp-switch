import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    exclude: ["e2e-playwright-test/**", "e2e-tauri/**", "node_modules/**"],
    coverage: {
      include: ["src/**"],
      exclude: [
        "src/test/**",
        "src/**/*.test.*",
        "src/types/**",
        "src/main.tsx",
        "src/App.tsx",
        "src/lib/tauri-api.ts",
        "src/lib/utils.ts",
      ],
    },
  },
});
