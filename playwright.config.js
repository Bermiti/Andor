import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 120000,
  use: {
    headless: true,
    baseURL: 'http://localhost:3000',
    viewport: { width: 1280, height: 800 },
    actionTimeout: 10000,
  },
  webServer: {
    command: 'npm run start',
    port: 3000,
    timeout: 120000,
    reuseExistingServer: false,
  },
});
