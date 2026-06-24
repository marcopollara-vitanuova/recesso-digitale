import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Carica le variabili dello staging per ottenere le credenziali admin di seed.
loadEnv({ path: ".env.staging" });

const PORT = 3030;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    headless: true,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev:staging",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
