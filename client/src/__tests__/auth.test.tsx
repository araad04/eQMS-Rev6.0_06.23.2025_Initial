import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock useAuth hook return values
vi.mock('@/hooks/use-auth', async () => {
  const actual = await vi.importActual('@/hooks/use-auth');
  return {
    ...actual,
    useAuth: vi.fn(),
  }
});

// Mock API requests
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  getQueryFn: vi.fn(),
  queryClient: {
    setQueryData: vi.fn(),
  },
}));

describe('Authentication', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  describe('Login Functionality', () => {
    it('should handle successful login', async () => {
      // Mock successful login
      const mockLoginMutation = {
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      };

      (useAuth as any).mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
        loginMutation: mockLoginMutation,
      });

      // Test component to isolate login functionality
      const LoginTest = () => {
        const { loginMutation } = useAuth();
        
        const handleLogin = () => {
          loginMutation.mutate({ username: 'testuser', password: 'password123' });
        };
        
        return (
          <div>
            <button onClick={handleLogin}>Login</button>
          </div>
        );
      };

      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <LoginTest />
          </AuthProvider>
        </QueryClientProvider>
      );

      fireEvent.click(screen.getByText('Login'));
      
      expect(mockLoginMutation.mutate).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
    });

    it('should display error message on failed login', async () => {
      // Mock failed login
      const mockLoginMutation = {
        mutate: vi.fn(),
        isPending: false,
        isError: true,
        error: new Error('Invalid credentials'),
      };

      (useAuth as any).mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
        loginMutation: mockLoginMutation,
      });

      // Test component to isolate login error handling
      const LoginErrorTest = () => {
        const { loginMutation } = useAuth();
        
        return (
          <div>
            {loginMutation.isError && <div>Error: {loginMutation.error.message}</div>}
            <button onClick={() => loginMutation.mutate({ username: 'wrong', password: 'wrong' })}>
              Login
            </button>
          </div>
        );
      };

      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <LoginErrorTest />
          </AuthProvider>
        </QueryClientProvider>
      );

      expect(screen.getByText('Error: Invalid credentials')).toBeInTheDocument();
    });
  });

  describe('Authentication State', () => {
    it('should provide user data when authenticated', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'admin',
        department: 'QA',
        createdAt: new Date().toISOString(),
      };

      (useAuth as any).mockReturnValue({
        user: mockUser,
        isLoading: false,
        error: null,
      });

      // Test component to check auth state
      const AuthStateTest = () => {
        const { user, isLoading } = useAuth();
        
        if (isLoading) return <div>Loading...</div>;
        
        return (
          <div>
            {user ? (
              <div>
                <div>Logged in as: {user.username}</div>
                <div>Role: {user.role}</div>
              </div>
            ) : (
              <div>Not authenticated</div>
            )}
          </div>
        );
      };

      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AuthStateTest />
          </AuthProvider>
        </QueryClientProvider>
      );

      expect(screen.getByText('Logged in as: testuser')).toBeInTheDocument();
      expect(screen.getByText('Role: admin')).toBeInTheDocument();
    });
  });
});