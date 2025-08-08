/// <reference types="vitest" />
import { getViteConfig } from 'astro/config'

// @ts-ignore - Vitest extends Vite config
export default getViteConfig({
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