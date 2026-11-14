import { defineConfig, devices } from "@playwright/test";

const apiPort = 18791;
const webPort = 13091;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${webPort}`,
    ...devices["Desktop Chrome"],
  },
  webServer: [
    {
      command: "node tests/fixtures/catalog-server.mjs",
      url: `http://127.0.0.1:${apiPort}/health`,
      env: { TEST_API_PORT: String(apiPort) },
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: `npm run start -- --hostname 127.0.0.1 --port ${webPort}`,
      url: `http://127.0.0.1:${webPort}`,
      env: { API_BASE_URL: `http://127.0.0.1:${apiPort}` },
      reuseExistingServer: false,
      timeout: 30000,
    },
  ],
});
