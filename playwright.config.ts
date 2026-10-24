// Testes E2E (docs/TESTING.md §3.6): o site estático de `npm run build:web`, servido como
// na Vercel (URLs sem .html e as mesmas regras de vercel.json, em e2e/serve.json).

import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Aparelho em português, como os testes de componente.
    locale: 'pt-BR',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'celular', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: `npx serve dist --listen ${PORT} --config ../e2e/serve.json --no-clipboard`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
