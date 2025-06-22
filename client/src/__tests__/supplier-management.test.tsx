import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SupplierManagementPage } from '@/pages/supplier-management';
import { CreateSupplierPage } from '@/pages/supplier-management/create';
import { useAuth } from '@/hooks/use-auth';
import { navigateTo } from '@/lib/navigation';

// Mocks
vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/navigation', () => ({
  navigateTo: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('Supplier Management Module', () => {
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
    
    // Mock auth with default user
    (useAuth as any).mockReturnValue({
      user: {
        id: 1,
        username: 'testuser',
        role: 'admin',
      },
      isLoading: false,
    });
  });

  describe('Supplier List View', () => {
    it('should render supplier list', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SupplierManagementPage />
        </QueryClientProvider>
      );

      // Check that the page renders correctly
      expect(screen.getByText('Supplier Management')).toBeInTheDocument();
      expect(screen.getByText('Add New Supplier')).toBeInTheDocument();
      
      // Check that the table headers are present
      expect(screen.getByText('Supplier ID')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should filter suppliers when searching', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SupplierManagementPage />
        </QueryClientProvider>
      );

      // Type in search box
      const searchInput = screen.getByPlaceholderText('Search suppliers...');
      fireEvent.change(searchInput, { target: { value: 'Electronics' } });

      // Expect filtered suppliers
      await waitFor(() => {
        expect(screen.getByText('ElectroMed Systems')).toBeInTheDocument();
      });
    });

    it('should navigate to create supplier page when clicking Add button', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SupplierManagementPage />
        </QueryClientProvider>
      );

      const addButton = screen.getByText('Add New Supplier');
      fireEvent.click(addButton);

      expect(navigateTo).toHaveBeenCalledWith('/supplier-management/create');
    });
  });

  describe('Create Supplier Form', () => {
    it('should render supplier creation form', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <CreateSupplierPage />
        </QueryClientProvider>
      );

      // Check that form renders correctly
      expect(screen.getByText('Add New Supplier')).toBeInTheDocument();
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Address & Contact Information')).toBeInTheDocument();
      expect(screen.getByText('Quality & Compliance')).toBeInTheDocument();
    });

    it('should validate required fields on form submission', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <CreateSupplierPage />
        </QueryClientProvider>
      );

      // Try to submit the form without filling required fields
      const submitButton = screen.getByText('Add Supplier');
      fireEvent.click(submitButton);

      // Expect validation errors
      await waitFor(() => {
        expect(screen.getAllByText(/field is required/i).length).toBeGreaterThan(0);
      });
    });

    it('should submit the form when all required fields are filled', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <CreateSupplierPage />
        </QueryClientProvider>
      );

      // Fill out form fields
      fireEvent.change(screen.getByLabelText(/Supplier Name/i), { 
        target: { value: 'Test Supplier' } 
      });
      
      fireEvent.change(screen.getByLabelText(/Description/i), { 
        target: { value: 'This is a test supplier description that is longer than 10 characters' } 
      });

      // Select category
      const categorySelect = screen.getByLabelText(/Supplier Category/i);
      fireEvent.change(categorySelect, { target: { value: 'Component Manufacturer' } });

      // Fill address information
      fireEvent.change(screen.getByLabelText(/Street Address/i), { 
        target: { value: '123 Test Street' } 
      });
      
      fireEvent.change(screen.getByLabelText(/City/i), { 
        target: { value: 'Test City' } 
      });
      
      fireEvent.change(screen.getByLabelText(/Country/i), { 
        target: { value: 'United States' } 
      });

      // Fill contact information
      fireEvent.change(screen.getByLabelText(/Contact Name/i), { 
        target: { value: 'John Tester' } 
      });
      
      fireEvent.change(screen.getByLabelText(/Contact Email/i), { 
        target: { value: 'john@test.com' } 
      });
      
      fireEvent.change(screen.getByLabelText(/Contact Phone/i), { 
        target: { value: '1234567890' } 
      });

      // Select Product Categories
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]); // Select first product category

      // Submit the form
      const submitButton = screen.getByText('Add Supplier');
      fireEvent.click(submitButton);

      // Verify form submission
      await waitFor(() => {
        expect(navigateTo).toHaveBeenCalledWith('/supplier-management');
      });
    });
  });
});