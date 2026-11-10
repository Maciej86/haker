import { defineConfig, devices } from '@playwright/test';

const viewport = { width: 1280, height: 800 };

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: 0,
  use: { baseURL: 'http://localhost:5178/haker/', viewport },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5178/haker/',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport } },
  ],
});
