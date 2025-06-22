import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { expect } from 'vitest';
import '@testing-library/jest-dom';

// Extend Vitest's expect with jest-dom matchers
declare module 'vitest' {
  interface Assertion<T = any> extends jest.Matchers<void, T> {}
  interface AsymmetricMatchersContaining extends jest.Matchers<void, any> {}
}

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test_eqms';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.SESSION_SECRET = 'test-session-secret-for-testing-only';

// Global test setup
beforeAll(async () => {
  console.log('🧪 Setting up test environment');
  
  // Setup test database if needed
  // Initialize test data
  // Setup authentication mocks
});

afterAll(async () => {
  console.log('🧹 Cleaning up test environment');
  
  // Cleanup test database
  // Clear test files
  // Reset mocks
});

beforeEach(() => {
  // Reset state before each test
  // Clear any test data
});

afterEach(() => {
  // Cleanup after each test
  // Reset mocks
});

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    department: 'Quality',
    createdAt: new Date().toISOString(),
    ...overrides
  }),
  
  createMockDocument: (overrides = {}) => ({
    id: 1,
    title: 'Test Document',
    type: 'procedure',
    status: 'draft',
    version: '1.0',
    content: 'Test content',
    createdBy: 1,
    createdAt: new Date().toISOString(),
    ...overrides
  }),
  
  createMockCapa: (overrides = {}) => ({
    id: 1,
    title: 'Test CAPA',
    description: 'Test description',
    source: 'internal',
    status: 'open',
    priority: 'medium',
    assignedTo: 1,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides
  })
};

// Custom matchers for eQMS-specific testing
expect.extend({
  toBeValidISO13485Document(received) {
    const pass = received && 
                 typeof received.title === 'string' &&
                 typeof received.version === 'string' &&
                 ['draft', 'review', 'approved', 'obsolete'].includes(received.status);
    
    return {
      message: () => `expected ${received} to be a valid ISO 13485 document`,
      pass
    };
  },
  
  toHaveValidAuditTrail(received) {
    const pass = received &&
                 Array.isArray(received.auditTrail) &&
                 received.auditTrail.every(entry => 
                   entry.action && entry.userId && entry.timestamp
                 );
    
    return {
      message: () => `expected ${received} to have valid audit trail`,
      pass
    };
  },
  
  toBeCompliantWithFDA21CFRPart11(received) {
    const pass = received &&
                 received.electronicSignature &&
                 received.auditTrail &&
                 received.dataIntegrity;
    
    return {
      message: () => `expected ${received} to be FDA 21 CFR Part 11 compliant`,
      pass
    };
  }
});

// Mock fetch for API testing
global.fetch = vi.fn();

// Console override for test clarity
const originalConsole = { ...console };
console.log = vi.fn();
console.error = vi.fn();
console.warn = vi.fn();

// Restore console in cleanup
afterAll(() => {
  Object.assign(console, originalConsole);
});