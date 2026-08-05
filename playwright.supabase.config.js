import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.supabase.spec.js',
  timeout: 180000,
  fullyParallel: false,
  workers: 1,
  use: {
    headless: true,
    baseURL: 'http://localhost:3000',
    actionTimeout: 10000,
  },
  projects: [
    {
      name: 'supabase-local-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node scripts/start-with-local-supabase.mjs',
    port: 3000,
    timeout: 240000,
    reuseExistingServer: false,
  },
});
