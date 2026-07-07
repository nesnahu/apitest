import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.UI_BASE_URL || (process.env.CI ? '' : 'http://localhost:3000');

if (!baseURL) {
  throw new Error('UI_BASE_URL is required when running Playwright in CI.');
}

export default defineConfig({
  testDir: './tests-ui',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : [['list']],
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
