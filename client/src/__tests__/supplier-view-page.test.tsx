import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { describe, it, expect, beforeEach } from 'vitest';
import SupplierManagementPage from '../pages/supplier-management/index';
import { createWrapper } from './mocks/mock-components';
import * as navigation from '@/lib/navigation';

// Mock the navigation module
vi.mock('@/lib/navigation', () => ({
  navigateTo: vi.fn(),
}));

// Mock hooks
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('Supplier View Navigation Tests (SUP005)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should navigate to the correct supplier detail page when View Details is clicked', async () => {
    // Render the supplier management page with the test wrapper
    render(<SupplierManagementPage />, { wrapper: createWrapper() });
    
    // Wait for the page to load and display supplier data
    await waitFor(() => {
      expect(screen.getByText('Add New Supplier')).toBeInTheDocument();
    });
    
    // Find and click the first "View Details" button
    const viewDetailsButtons = screen.getAllByText('View Details');
    expect(viewDetailsButtons.length).toBeGreaterThan(0);
    
    fireEvent.click(viewDetailsButtons[0]);
    
    // Check that navigateTo was called with the correct URL
    expect(navigation.navigateTo).toHaveBeenCalledWith(expect.stringMatching(/\/supplier-management\/view\/\d+/));
  });

  it('should not cause a 404 error when navigating to supplier detail page', async () => {
    // Render the supplier management page with the test wrapper
    render(<SupplierManagementPage />, { wrapper: createWrapper() });
    
    // Wait for the page to load and display supplier data
    await waitFor(() => {
      expect(screen.getByText('Add New Supplier')).toBeInTheDocument();
    });
    
    // Find and click the first "View Details" button
    const viewDetailsButtons = screen.getAllByText('View Details');
    expect(viewDetailsButtons.length).toBeGreaterThan(0);
    
    fireEvent.click(viewDetailsButtons[0]);
    
    // The navigation URL should include /view/ to match the route in App.tsx
    expect(navigation.navigateTo).toHaveBeenCalledWith(expect.stringMatching(/\/supplier-management\/view\/\d+/));
  });
});