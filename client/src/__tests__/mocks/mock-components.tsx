/**
 * Mock components for testing purposes
 * Used to test IEC 62304 compliance of various modules
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Create a fresh QueryClient for each test
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
  logger: {
    log: console.log,
    warn: console.warn,
    error: () => {},
  },
});

// Wrapper component with query client
export const createWrapper = () => {
  const testQueryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Mock navigation
export const mockNavigateTo = vi.fn();

// Mock toast
export const mockToast = vi.fn();
export const useToastMock = () => ({
  toast: mockToast,
});

// Mock auth
export const mockUser = {
  id: 1,
  username: 'testuser',
  role: 'admin',
};

export const useAuthMock = vi.fn().mockReturnValue({
  user: mockUser,
  isLoading: false,
});

// Mock API calls
export const mockApiSuccess = (data: any) => 
  vi.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
    status: 200,
  });

export const mockApiError = (message = 'API Error') => 
  vi.fn().mockRejectedValue(new Error(message));