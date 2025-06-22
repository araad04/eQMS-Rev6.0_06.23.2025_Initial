import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NonconformingProductsPage from '../pages/production/nonconforming-products';
import NonconformingProductDetail from '../pages/production/nonconforming-product-detail';
import { BrowserRouter } from 'react-router-dom';
import * as wouter from 'wouter';

// Mock the wouter navigation hook
vi.mock('wouter', async () => {
  const actual = await vi.importActual('wouter');
  return {
    ...actual,
    useLocation: () => ['/production/nonconforming-products', vi.fn()],
    useParams: () => ({ id: '1' }),
    useRoute: () => [true, { id: '1' }]
  };
});

// Mock toast hook
vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Setup test with router wrapper
const renderWithRouter = (ui: React.ReactNode) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Nonconforming Products Module', () => {
  describe('Nonconforming Products List Page', () => {
    it('renders nonconforming products page properly', () => {
      const navigateMock = vi.fn();
      vi.spyOn(wouter, 'useLocation').mockImplementation(() => ['/production/nonconforming-products', navigateMock]);
      
      renderWithRouter(<NonconformingProductsPage />);
      
      // Check if page title is rendered
      expect(screen.getByText('Nonconforming Products')).toBeInTheDocument();
      
      // Check if table headers are displayed
      expect(screen.getByText('Product ID')).toBeInTheDocument();
      expect(screen.getByText('Batch Number')).toBeInTheDocument();
      expect(screen.getByText('Date Detected')).toBeInTheDocument();
      expect(screen.getByText('Severity')).toBeInTheDocument();
      
      // Check if sample data is displayed
      expect(screen.getByText('P-10234')).toBeInTheDocument();
      expect(screen.getByText('B-2025-001')).toBeInTheDocument();
      
      // Test View button functionality - NCP003/NCP004 fix
      const viewButtons = screen.getAllByText('View');
      expect(viewButtons.length).toBeGreaterThan(0);
      
      fireEvent.click(viewButtons[0]);
      
      // Verify navigation was called with correct route
      expect(navigateMock).toHaveBeenCalledWith('/production/nonconforming-products/1');
    });
  });
  
  describe('Nonconforming Product Detail Page', () => {
    it('renders nonconforming product detail view properly', async () => {
      const navigateMock = vi.fn();
      vi.spyOn(wouter, 'useLocation').mockImplementation(() => ['/production/nonconforming-products/1', navigateMock]);
      
      renderWithRouter(<NonconformingProductDetail />);
      
      // Wait for the data to load (simulated API delay)
      await waitFor(() => {
        // Check if tabs are rendered
        expect(screen.getByText('Details')).toBeInTheDocument();
        expect(screen.getByText('Investigation')).toBeInTheDocument();
        expect(screen.getByText('Corrective Actions')).toBeInTheDocument();
        expect(screen.getByText('Documents')).toBeInTheDocument();
        
        // Check if key product information is displayed
        expect(screen.getByText('Sterility test failure in final product')).toBeInTheDocument();
        
        // Check if navigation buttons work
        const backButton = screen.getAllByText('Back to List')[0];
        fireEvent.click(backButton);
        expect(navigateMock).toHaveBeenCalledWith('/production/nonconforming-products');
      });
    });
    
    it('handles non-existent product correctly', async () => {
      const navigateMock = vi.fn();
      
      // Mock params to return a non-existent ID
      vi.spyOn(wouter, 'useParams').mockImplementation(() => ({ id: '999' }));
      vi.spyOn(wouter, 'useLocation').mockImplementation(() => ['/production/nonconforming-products/999', navigateMock]);
      
      renderWithRouter(<NonconformingProductDetail />);
      
      // Wait for the data to load (simulated API delay)
      await waitFor(() => {
        // Check if "not found" message is displayed
        expect(screen.getByText('Product Not Found')).toBeInTheDocument();
        expect(screen.getByText(/could not be found in the system/i)).toBeInTheDocument();
        
        // Check if return button works
        const returnButton = screen.getByText('Return to List');
        fireEvent.click(returnButton);
        expect(navigateMock).toHaveBeenCalledWith('/production/nonconforming-products');
      });
    });
  });
});