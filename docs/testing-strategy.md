# Testing Strategy

Three-layer test architecture designed to achieve **equivalence** between automated tests and real user behavior (UI + `omp` CLI).

---

## Layer 1: Rust Pipeline Integration Tests

**Command:** `npm run test:pipeline`

**Location:** `src-tauri/tests/pipeline_test.rs`

**What they test:**
- Builtin preset upsert logic (Bug 1 regression)
- Provider + models round-trip through DB → `models.yml`
- YAML schema correctness (Bug 2 regression)
- Serde alias field mapping (Bug 3 regression)
- `omp` CLI can parse the generated YAML without crashing

**Why they exist:** The existing Rust unit tests (`config_writer_test.rs`, `provider_service_test.rs`) verified individual functions, but none tested the **full pipeline** from frontend payload → DB → YAML → omp CLI.

**Limitation:** They don't exercise the actual Tauri IPC layer or the WebView UI.

---

## Layer 2: Mock E2E Tests

**Command:** `npm run test:e2e`

**Location:** `e2e-playwright-test/`

**What they test:**
- Frontend UI behavior (forms, navigation, validation, CRUD)
- Component interactions and responsive layouts
- Keyboard shortcuts and accessibility

**What they do NOT test (and why):**
- **SQLite** — the mock stores state in `localStorage`, not SQLite.
- **`config_writer`** — the mock intercepts IPC calls and returns in-memory state.
- **`models.yml`** — no filesystem writes occur.
- **`omp` CLI** — the mock's `chat_completion` sends HTTP directly from the browser.

These tests are fast and reliable for frontend regression but **cannot catch backend bugs**.

---

## Layer 3: Real-App E2E Tests

### Linux / CI (tauri-driver)

**Config:** `playwright.tauri.config.ts`

Uses `tauri-driver` (WebDriver BiDi proxy) to control the real Tauri binary via Playwright. Tests run against the actual WebView with real IPC, SQLite, and file writes.

**Limitation:** `tauri-driver` is **not supported on macOS**. Use the macOS smoke test script instead.

### macOS (smoke test script)

**Command:** `npm run test:e2e:real`

**Script:** `scripts/e2e-real.sh`

Builds the debug `.app` bundle, launches it, waits for startup, then verifies:
1. `~/.omp/agent/models.yml` contains step-plan with model entries
2. `omp --list-models` runs without YAML parse errors

---

## Bug Coverage Matrix

| Bug | Layer 1 (pipeline) | Layer 2 (mock E2E) | Layer 3 (real app) |
|-----|-------------------|-------------------|-------------------|
| Bug 1 — step-plan not seeded | **Caught** | Missed | **Caught** |
| Bug 2 — models missing in YAML | **Caught** | Missed | **Caught** |
| Bug 3 — serde alias dropped fields | **Caught** | Missed | **Caught** |
| UI form validation | Missed | **Caught** | **Caught** |
| omp CLI parse errors | **Caught** | Missed | **Caught** |

---

## Recommended CI Setup

```yaml
# .github/workflows/ci.yml (excerpt)
jobs:
  test:
    steps:
      - uses: actions/checkout@v4

      # Layer 1
      - run: npm run test:pipeline

      # Layer 2
      - run: npm run test:e2e

      # Layer 3 (Linux only)
      - run: npm run tauri build -- --debug
      - run: npx playwright test --config playwright.tauri.config.ts
```

## Local Development

```bash
# Quick feedback loop (frontend + backend logic)
npm run test          # vitest unit tests
npm run test:pipeline # Rust pipeline tests

# Full mock E2E (fast, no Tauri binary needed)
npm run test:e2e

# macOS real-app verification
npm run test:e2e:real
```
