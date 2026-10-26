import { defineConfig } from 'vitest/config'
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: process.env.VITEST ? [svelte({ preprocess: vitePreprocess({ script: true }) })] : [],
  resolve: {
    conditions: ['browser'],
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.astro/',
        '*.config.*',
        '**/*.d.ts',
        'test/',
        '**/*.test.*',
        '**/*.spec.*',
      ],
    },
  },
})
