# AGENTS.md

- Use `npm install` from the repo root; this project has `package-lock.json` (no pnpm/yarn lockfile) plus `src-tauri/Cargo.lock`.
- Dev/build: `npm run tauri dev` launches the Tauri app; `npm run tauri build` runs `npm run build` first via `src-tauri/tauri.conf.json`; frontend-only dev is `npm run dev` on fixed port `5173`.
- Verification shortcuts: `npm run build` = `tsc && vite build`; `npm run test` = Vitest jsdom with `src/test/setup.ts`; focused test: `npx vitest run src/path/file.test.tsx`.
- E2E source of truth is `npm run test:e2e` / `playwright.config.ts`, testDir `e2e-playwright-test`; it starts `npm run dev`.
- **Testing is three-layered:**
  - **Layer 1 — Rust Pipeline (`npm run test:pipeline`)**: `src-tauri/tests/pipeline_test.rs` tests the full DB → `models.yml` → `omp` CLI pipeline. Must run with `--test-threads=1` because `get_models_yaml_path()` writes to real `~/.omp/agent/models.yml`.
  - **Layer 2 — Mock E2E (`npm run test:e2e`)**: `e2e-playwright-test/` runs against `localhost:5173` (Vite only, **no Tauri backend**). Uses `localStorage`-based mock via `tauri-mock.ts`. Fast for frontend regression but **never** exercises SQLite, `config_writer`, or filesystem writes.
  - **Layer 3 — Real App (`npm run test:e2e:real`)**: `scripts/e2e-real.sh` builds debug Tauri binary, launches it, verifies `models.yml` content, and runs `omp --list-models`. `tauri-driver` (Linux/CI) config in `playwright.tauri.config.ts`. **Not supported on macOS.**
- **HARD RULE: No mock data in Layer 1 and Layer 3.** All real-backend tests must use real SQLite and verify actual file writes. Layer 2 mock E2E is frontend-only regression and does not replace backend verification.
- Frontend entrypoints: `src/main.tsx` -> `src/App.tsx`; routes use `wouter`, stores use Zustand, Tauri IPC is wrapped in `src/lib/tauri-api.ts`; `@/*` aliases to `src/*`.
- Rust backend is under `src-tauri/src`: `commands/` are Tauri IPC handlers, `services/` business logic/file sync, `database/` SQLite DAOs; Cargo package requires Rust `1.77.2` despite README saying `>=1.70`.
