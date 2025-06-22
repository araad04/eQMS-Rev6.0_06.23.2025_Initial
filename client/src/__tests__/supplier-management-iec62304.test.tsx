/**
 * Supplier Management Module Test Suite
 * IEC 62304:2006+AMD1:2015 Compliant Test Cases
 * 
 * Document ID: TEST-SUPPLIER-001
 * Version: 1.0.0
 * Classification: Software Safety Class B
 * 
 * Related Requirements:
 * - REQ-SUPP-001: Supplier Information Management
 * - REQ-SUPP-002: Supplier Risk Assessment
 * - REQ-SUPP-003: Critical Supplier Identification
 * - REQ-SUPP-004: Supplier Qualification Status Tracking
 * - REQ-SUPP-005: Supplier Performance Monitoring
 * 
 * Test Strategy: This test suite provides comprehensive validation of the
 * Supplier Management Module in accordance with IEC 62304 requirements.
 * Unit, integration, and system tests are included to verify correct functionality
 * and proper error handling.
 * 
 * Last Updated: 2025-05-15
 * Author: System Development Team
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  test, 
  describe62304, 
  RiskClassification, 
  TestType 
} from './iec62304-test-framework';
import SupplierManagementPage from '@/pages/supplier-management';
import CreateSupplierPage from '@/pages/supplier-management/create';
import { useAuth } from '@/hooks/use-auth';
import { navigateTo } from '@/lib/navigation';
import { vi, beforeEach, expect } from 'vitest';

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

describe62304('Supplier Management Module', {
  module: 'Supplier Management',
  riskClass: RiskClassification.CLASS_B,
}, () => {
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

  describe62304('Supplier Listing and Filtering', {
    module: 'Supplier Management - List View',
    riskClass: RiskClassification.CLASS_B,
  }, () => {
    test('Renders supplier list with correct information', {
      requirement: 'REQ-SUPP-001',
      testType: TestType.UNIT,
      riskClass: RiskClassification.CLASS_B,
      description: 'Verifies that the supplier list renders with all required supplier information',
      verification: 'UI inspection and DOM validation',
      expected: 'Supplier list should display with supplier ID, name, category, criticality, risk level, status, and performance metrics',
    }, async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SupplierManagementPage />
        </QueryClientProvider>
      );

      // Verify page structure
      expect(screen.getByText('Supplier Management')).toBeInTheDocument();
      expect(screen.getByText('Add New Supplier')).toBeInTheDocument();
      
      // Verify table headers - critical information fields per IEC 62304
      expect(screen.getByText('Supplier ID')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Criticality')).toBeInTheDocument();
      expect(screen.getByText('Risk Level')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
      
      // Verify first supplier record is present with correct data
      expect(screen.getByText('SUP-001')).toBeInTheDocument();
      expect(screen.getByText('MedicalComponents Inc.')).toBeInTheDocument();
    });

    test('Search functionality filters suppliers correctly', {
      requirement: 'REQ-SUPP-001',
      testType: TestType.UNIT,
      riskClass: RiskClassification.CLASS_B,
      description: 'Validates that the search functionality correctly filters suppliers',
      verification: 'Input validation and result verification',
      expected: 'Filtering should show only suppliers matching the search term',
    }, async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SupplierManagementPage />
        </QueryClientProvider>
      );

      // Get the search input
      const searchInput = screen.getByPlaceholderText('Search suppliers...');
      
      // Type search term
      fireEvent.change(searchInput, { target: { value: 'Electronics' } });

      // Wait for filtered results and verify
      await waitFor(() => {
        expect(screen.getByText('ElectroMed Systems')).toBeInTheDocument();
        // Verify that a non-matching supplier is not displayed
        expect(screen.queryByText('SterileTech Services')).not.toBeInTheDocument();
      });
    });

    test('Tab filtering works for critical suppliers', {
      requirement: 'REQ-SUPP-003',
      testType: TestType.UNIT,
      riskClass: RiskClassification.CLASS_B,
      description: 'Validates that tab filtering correctly shows only critical suppliers',
      verification: 'Tab navigation and filtered list validation',
      expected: 'Critical tab should show only suppliers with critical classification',
    }, async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SupplierManagementPage />
        </QueryClientProvider>
      );

      // Click on the Critical tab
      fireEvent.click(screen.getByText('Critical'));

      // Verify that only critical suppliers are shown
      await waitFor(() => {
        expect(screen.getByText('MedicalComponents Inc.')).toBeInTheDocument();
        expect(screen.getByText('SterileTech Services')).toBeInTheDocument();
        expect(screen.getByText('PrecisionMold Manufacturing')).toBeInTheDocument();
        
        // Verify that non-critical suppliers are not displayed
        expect(screen.queryByText('ElectroMed Systems')).not.toBeInTheDocument();
      });
    });

    test('Navigation to create supplier page works', {
      requirement: 'REQ-SUPP-001',
      testType: TestType.INTEGRATION,
      riskClass: RiskClassification.CLASS_B,
      description: 'Verifies navigation from list page to create supplier page',
      verification: 'Click event and navigation verification',
      expected: 'Clicking Add New Supplier button should navigate to creation page',
    }, async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SupplierManagementPage />
        </QueryClientProvider>
      );

      // Click the Add New Supplier button
      const addButton = screen.getByText('Add New Supplier');
      fireEvent.click(addButton);

      // Verify navigation was attempted
      expect(navigateTo).toHaveBeenCalledWith('/supplier-management/create');
    });
  });

  describe62304('Supplier Creation Form', {
    module: 'Supplier Management - Create',
    riskClass: RiskClassification.CLASS_B,
  }, () => {
    test('Supplier creation form renders with all required fields', {
      requirement: 'REQ-SUPP-001',
      testType: TestType.UNIT,
      riskClass: RiskClassification.CLASS_B,
      description: 'Verifies that the supplier creation form renders with all required fields',
      verification: 'UI inspection and DOM validation',
      expected: 'Form should display all mandatory and optional fields for supplier information',
    }, async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <CreateSupplierPage />
        </QueryClientProvider>
      );

      // Verify form sections
      expect(screen.getByText('Add New Supplier')).toBeInTheDocument();
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Address & Contact Information')).toBeInTheDocument();
      expect(screen.getByText('Quality & Compliance')).toBeInTheDocument();
      
      // Verify critical fields - required for IEC 62304 compliance
      expect(screen.getByLabelText(/Supplier Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Supplier Category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Street Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/City/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Country/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Contact Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Contact Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Contact Phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Criticality Level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Initial Risk Level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Qualification Status/i)).toBeInTheDocument();
      
      // Verify form action buttons
      expect(screen.getByText('Add Supplier')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    test('Form validation prevents submission with missing required fields', {
      requirement: 'REQ-SUPP-001',
      testType: TestType.UNIT,
      riskClass: RiskClassification.CLASS_B,
      description: 'Validates that form validation prevents submission with missing required fields',
      verification: 'Form submission attempt with empty fields',
      expected: 'Form submission should be prevented and validation errors displayed',
    }, async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <CreateSupplierPage />
        </QueryClientProvider>
      );

      // Try to submit the form without filling required fields
      const submitButton = screen.getByText('Add Supplier');
      fireEvent.click(submitButton);

      // Verify validation errors appear
      await waitFor(() => {
        const nameField = screen.getByLabelText(/Supplier Name/i);
        expect(nameField).toBeInTheDocument();
        expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument();
        
        // At least one validation message should be displayed
        expect(screen.getAllByText(/required|at least/i).length).toBeGreaterThan(0);
      });
    });

    test('Risk assessment fields are properly configured', {
      requirement: 'REQ-SUPP-002',
      testType: TestType.UNIT,
      riskClass: RiskClassification.CLASS_B,
      description: 'Validates that risk assessment fields (criticality and risk level) are properly configured',
      verification: 'Field inspection and option validation',
      expected: 'Risk fields should have appropriate options (High/Medium/Low for risk, Critical/Major/Minor for criticality)',
    }, async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <CreateSupplierPage />
        </QueryClientProvider>
      );

      // Click on criticality dropdown to open it
      const criticalityField = screen.getByLabelText(/Criticality Level/i);
      fireEvent.mouseDown(criticalityField);
      
      // Verify criticality options
      await waitFor(() => {
        expect(screen.getByText('Critical')).toBeInTheDocument();
        expect(screen.getByText('Major')).toBeInTheDocument();
        expect(screen.getByText('Minor')).toBeInTheDocument();
      });
      
      // Close criticality dropdown
      fireEvent.mouseDown(criticalityField);
      
      // Click on risk level dropdown to open it
      const riskField = screen.getByLabelText(/Initial Risk Level/i);
      fireEvent.mouseDown(riskField);
      
      // Verify risk level options
      await waitFor(() => {
        expect(screen.getByText('High')).toBeInTheDocument();
        expect(screen.getByText('Medium')).toBeInTheDocument();
        expect(screen.getByText('Low')).toBeInTheDocument();
      });
    });

    test('Form successfully submits with valid data', {
      requirement: 'REQ-SUPP-001',
      testType: TestType.INTEGRATION,
      riskClass: RiskClassification.CLASS_B,
      description: 'Validates that form successfully submits with all valid data',
      verification: 'Complete form submission with valid data',
      expected: 'Form should submit successfully and redirect to supplier list',
    }, async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <CreateSupplierPage />
        </QueryClientProvider>
      );

      // Fill all required fields
      // Basic Information
      fireEvent.change(screen.getByLabelText(/Supplier Name/i), { 
        target: { value: 'IEC62304 Test Supplier' } 
      });
      
      // Select category
      const categoryField = screen.getByLabelText(/Supplier Category/i);
      fireEvent.mouseDown(categoryField);
      await waitFor(() => {
        fireEvent.click(screen.getByText('Component Manufacturer'));
      });
      
      fireEvent.change(screen.getByLabelText(/Description/i), { 
        target: { value: 'This is a test supplier description for IEC 62304 compliance testing.' } 
      });
      
      // Address & Contact Information
      fireEvent.change(screen.getByLabelText(/Street Address/i), { 
        target: { value: '123 Medical Device Avenue' } 
      });
      
      fireEvent.change(screen.getByLabelText(/City/i), { 
        target: { value: 'Quality City' } 
      });
      
      // Select country
      const countryField = screen.getByLabelText(/Country/i);
      fireEvent.mouseDown(countryField);
      await waitFor(() => {
        fireEvent.click(screen.getByText('United States'));
      });
      
      fireEvent.change(screen.getByLabelText(/Contact Name/i), { 
        target: { value: 'John Quality' } 
      });
      
      fireEvent.change(screen.getByLabelText(/Contact Email/i), { 
        target: { value: 'john@qualitysupplier.com' } 
      });
      
      fireEvent.change(screen.getByLabelText(/Contact Phone/i), { 
        target: { value: '1234567890' } 
      });
      
      // Quality & Compliance Information
      // Select one product category checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]); // Click first checkbox in product categories
      
      // Submit the form
      const submitButton = screen.getByText('Add Supplier');
      fireEvent.click(submitButton);
      
      // Verify form submission navigates to supplier list
      await waitFor(() => {
        expect(navigateTo).toHaveBeenCalledWith('/supplier-management');
      });
    });
  });

  describe62304('Supplier Risk Classification', {
    module: 'Supplier Risk Management', 
    riskClass: RiskClassification.CLASS_B,
  }, () => {
    test('Critical suppliers are correctly identified and flagged', {
      requirement: 'REQ-SUPP-003',
      testType: TestType.UNIT,
      riskClass: RiskClassification.CLASS_B,
      description: 'Validates that critical suppliers are correctly identified and visually flagged',
      verification: 'UI inspection and DOM validation',
      expected: 'Critical suppliers should be clearly marked with Critical badge',
    }, async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SupplierManagementPage />
        </QueryClientProvider>
      );

      // Look for critical badges
      const criticalBadges = screen.getAllByText('Critical');
      
      // There should be at least one critical supplier
      expect(criticalBadges.length).toBeGreaterThan(0);
      
      // Verify critical badge styling (IEC 62304 requires clear visual distinction)
      const criticalBadge = criticalBadges[0].closest('span') || criticalBadges[0];
      const badgeClasses = criticalBadge.className;
      
      // Badge should have a distinct style
      expect(badgeClasses).toContain('destructive');
    });

    test('Supplier risk metrics dashboard displays correctly', {
      requirement: 'REQ-SUPP-005',
      testType: TestType.UNIT,
      riskClass: RiskClassification.CLASS_B,
      description: 'Validates that the supplier risk metrics dashboard displays correctly',
      verification: 'UI inspection and DOM validation',
      expected: 'Dashboard should display supplier counts by risk level and approval status',
    }, async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SupplierManagementPage />
        </QueryClientProvider>
      );

      // Verify metrics cards
      expect(screen.getByText('Total Suppliers')).toBeInTheDocument();
      expect(screen.getByText('Critical Suppliers')).toBeInTheDocument();
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('Audits Due')).toBeInTheDocument();
      expect(screen.getByText('Avg. Performance')).toBeInTheDocument();
      
      // Verify the supplier performance section
      expect(screen.getByText('Supplier Performance')).toBeInTheDocument();
      
      // Verify the metrics have values
      const metrics = screen.getAllByText(/\d+/);
      expect(metrics.length).toBeGreaterThan(0);
    });
  });
});