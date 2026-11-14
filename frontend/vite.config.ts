import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  // A production build without the API address would quietly call localhost from
  // every visitor's browser. Fail the build instead (set VITE_API_URL on the host).
  if (mode === 'production' && !loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL) {
    throw new Error('VITE_API_URL is not set. Set it to the backend URL, e.g. https://<backend>.onrender.com/api')
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
    server: { port: 5173 },
    test: {
      environment: 'jsdom',
      setupFiles: ['src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
      restoreMocks: true,
      // Page tests render the whole app (lazy routes + i18n areas); with every file
      // running in parallel a slow machine needs more than the 5 s default. A real hang
      // still fails, just later.
      testTimeout: 20_000,
    },
  }
})
