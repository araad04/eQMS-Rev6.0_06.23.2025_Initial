/**
 * Server Test Setup
 * 
 * This file configures the test environment for server-side tests
 * Includes necessary mocks and configuration for testing
 */

import { beforeEach, afterEach, vi } from 'vitest';

// Reset mocks after each test
afterEach(() => {
  vi.restoreAllMocks();
});

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.TEST_JWT_SECRET = 'test-secret-for-test-environment-only';
process.env.TEST_SESSION_SECRET = 'test-session-secret-for-test-environment-only';

// Mock database for testing
vi.mock('../db', () => {
  return {
    db: {
      execute: vi.fn().mockImplementation(async () => ({ rows: [] })),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 1 }])
    },
    pool: {
      connect: vi.fn().mockResolvedValue({
        query: vi.fn().mockResolvedValue({ rows: [] }),
        release: vi.fn()
      })
    }
  };
});

// Mock logger to avoid console spam during tests
vi.mock('../utils/logger', () => {
  return {
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    }
  };
});