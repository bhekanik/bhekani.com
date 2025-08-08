/// <reference types="vitest" />
import { getViteConfig } from 'astro/config'

export default getViteConfig({
  // @ts-expect-error - Vitest config is valid but types aren't fully compatible
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