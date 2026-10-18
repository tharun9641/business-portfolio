import { defineConfig, devices } from '@playwright/test'

/** Cross-browser pass: Chromium, WebKit (Safari engine) and Firefox at 375/768/1280/1920. */
const PORT = 3200
export default defineConfig({
  testDir: './tests/cross',
  timeout: 180_000,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 300_000,
  },
})
