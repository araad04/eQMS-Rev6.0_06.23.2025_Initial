// Test setup file for Jest/Vitest
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';

// Add testing-library matchers to Vitest
expect.extend(matchers);

// Add global types for the matchers
declare global {
  namespace Vi {
    interface Assertion {
      toBeInTheDocument(): void;
      toHaveTextContent(text: string): void;
      toBeVisible(): void;
      toBeDisabled(): void;
      toBeEnabled(): void;
      toHaveClass(className: string): void;
      toHaveValue(value: string | number | boolean): void;
    }
  }
}

// Cleanup after each test
afterEach(() => {
  cleanup();
});