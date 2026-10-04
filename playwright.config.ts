import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3117',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3117',
    url: 'http://127.0.0.1:3117',
    reuseExistingServer: false,
    timeout: 120000,
  },
})
