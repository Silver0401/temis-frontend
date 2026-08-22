import { defineConfig, devices } from "@playwright/test";

// E2E_BASE_URL permite apuntar la suite a otra instancia (ej. http://localhost:3100)
const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  // Next.js dev compila rutas on-demand (primer hit puede tardar >90s);
  // debe exceder cómodamente los expect() internos más largos (150000ms).
  timeout: 200000,
  fullyParallel: true,
  // Cada worker usa su propio usuario E2E (tests/e2e/fixtures.ts), así que
  // el paralelismo ya no choca con el límite de 1 sesión "computer" por
  // usuario del backend (src/channels.ts). Ajustable vía PLAYWRIGHT_WORKERS.
  workers: process.env.PLAYWRIGHT_WORKERS
    ? Number(process.env.PLAYWRIGHT_WORKERS)
    : 2,
  retries: process.env.CI ? 2 : 1,
  use: {
    baseURL,
    navigationTimeout: 120000,
    actionTimeout: 15000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    launchOptions: {
      args: ["--use-gl=swiftshader", "--enable-webgl"],
    },
  },
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
  projects: [{ name: "chromium" }],
});
