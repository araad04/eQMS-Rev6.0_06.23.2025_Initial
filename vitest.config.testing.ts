import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './test-results/unit/coverage-reports',
      thresholds: {
        lines: 90,
        functions: 80,
        branches: 85,
        statements: 90
      },
      exclude: [
        'node_modules/',
        'test-results/',
        'docs/',
        'coverage/',
        '*.config.*',
        'migrations/',
        'uploads/',
        'attached_assets/'
      ]
    },
    outputFile: {
      json: './test-results/unit/test-results/results.json',
      junit: './test-results/unit/test-results/junit.xml'
    },
    reporters: ['default', 'json', 'junit', 'html'],
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './client/src'),
      '@shared': resolve(__dirname, './shared'),
      '@server': resolve(__dirname, './server'),
      '@tests': resolve(__dirname, './tests')
    }
  }
});