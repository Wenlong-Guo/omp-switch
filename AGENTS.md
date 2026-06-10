# AGENTS.md

- Use `npm install` from the repo root; this project has `package-lock.json` (no pnpm/yarn lockfile) plus `src-tauri/Cargo.lock`.
- Dev/build: `npm run tauri dev` launches the Tauri app; `npm run tauri build` runs `npm run build` first via `src-tauri/tauri.conf.json`; frontend-only dev is `npm run dev` on fixed port `5173`.
- Verification shortcuts: `npm run build` = `tsc && vite build`; `npm run test` = Vitest jsdom with `src/test/setup.ts`; focused test: `npx vitest run src/path/file.test.tsx`.
- E2E source of truth is `npm run test:e2e` / `playwright.config.ts`, testDir `e2e-playwright-test`; it starts `npm run dev`.
- **HARD RULE: No mock data allowed.** All tests and operations must use real data. E2E tests must connect to real backend or real APIs. Model configs must map to real services. Tests must send real HTTP requests and verify responses (e.g., HTTP 200).
- Frontend entrypoints: `src/main.tsx` -> `src/App.tsx`; routes use `wouter`, stores use Zustand, Tauri IPC is wrapped in `src/lib/tauri-api.ts`; `@/*` aliases to `src/*`.
- Rust backend is under `src-tauri/src`: `commands/` are Tauri IPC handlers, `services/` business logic/file sync, `database/` SQLite DAOs; Cargo package requires Rust `1.77.2` despite README saying `>=1.70`.
