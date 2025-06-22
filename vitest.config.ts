import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'coverage/',
        'dist/',
        'build/',
        '.next/',
        'public/',
        'migrations/',
        'drizzle.config.ts'
      ],
      thresholds: {
        // Critical modules require 95%+ coverage for regulatory compliance
        'server/routes.capa.ts': {
          statements: 95,
          branches: 95,
          functions: 95,
          lines: 95
        },
        'server/routes.management-review.ts': {
          statements: 95,
          branches: 95,
          functions: 95,
          lines: 95
        },
        'server/routes.training.ts': {
          statements: 95,
          branches: 95,
          functions: 95,
          lines: 95
        },
        'server/storage*.ts': {
          statements: 90,
          branches: 90,
          functions: 90,
          lines: 90
        },
        // Global thresholds
        global: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80
        }
      }
    },
    testTimeout: 30000,
    hookTimeout: 30000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@server': path.resolve(__dirname, './server')
    }
  }
});