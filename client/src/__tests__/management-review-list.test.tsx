/**
 * Management Review List Test Suite
 * IEC 62304:2006+AMD1:2015 Compliant Test Cases
 * 
 * Document ID: TEST-MGREVIEW-001
 * Version: 1.0.0
 * Classification: Software Safety Class B
 * 
 * Related Requirements:
 * - MAN-001: The system shall support creation and management of management review meetings.
 * - MAN-005: The system shall display a list of management reviews.
 * - MAN-008: The system shall support management review metrics and trending.
 * - MAN-009: The system shall support management review scheduling.
 * - MAN-013: The system shall support management review access control.
 * 
 * Test Strategy: This test suite validates the Management Review List functionality
 * according to IEC 62304 requirements for medical device software.
 * 
 * Last Updated: 2025-05-18
 * Author: System Development Team
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Extend the expect interface with Jest DOM matchers
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
import ManagementReviewList from '@/pages/management-review';
import { navigateTo } from '@/lib/navigation';
import { useAuth } from '@/hooks/use-auth';

// Mocks
vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/navigation', () => ({
  navigateTo: vi.fn(),
}));

// Mock data for testing
const mockManagementReviews = [
  {
    id: 1,
    title: 'MR-2025-001: Q1 Management Review Meeting',
    status: 'scheduled',
    review_type: 'Regular',
    review_date: '2025-03-15T10:00:00.000Z',
    created_by: 1,
    scheduled_by: 1,
    createdAt: '2025-02-15T10:00:00.000Z'
  },
  {
    id: 2,
    title: 'MR-2025-002: Q2 Management Review Meeting',
    status: 'in-progress',
    review_type: 'Regular',
    review_date: '2025-06-15T10:00:00.000Z',
    created_by: 1,
    scheduled_by: 1,
    createdAt: '2025-05-15T10:00:00.000Z'
  },
  {
    id: 3,
    title: 'MR-2025-003: Special Review - New Product Line',
    status: 'completed',
    review_type: 'Special',
    review_date: '2025-04-10T10:00:00.000Z',
    approval_date: '2025-04-10T15:00:00.000Z',
    created_by: 1,
    scheduled_by: 1,
    createdAt: '2025-03-20T10:00:00.000Z'
  }
];

describe('Management Review List Page', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          queryFn: ({ queryKey }) => {
            const url = Array.isArray(queryKey) ? queryKey[0] : queryKey;
            if (typeof url === 'string') {
              return fetch(url).then(res => res.json());
            }
            return Promise.reject(new Error(`Invalid queryKey: ${queryKey}`));
          }
        },
      },
    });

    // Mock authentication
    (useAuth as any).mockReturnValue({
      user: { id: 1, role: 'admin', firstName: 'Test', lastName: 'User' },
      isAuthenticated: true,
    });

    // Mock fetch responses
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      const urlString = url.toString();
      if (urlString.includes('/api/management-reviews')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockManagementReviews),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);
    });
  });

  it('should render the management review list page', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ManagementReviewList />
      </QueryClientProvider>
    );

    // Check that the page title and schedule button are present
    await waitFor(() => {
      expect(screen.getByText('Management Reviews')).toBeInTheDocument();
      expect(screen.getByText('Schedule Review')).toBeInTheDocument();
    });

    // Check that the table headers are present
    expect(screen.getByText('Review ID')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Review Date')).toBeInTheDocument();
  });

  it('should display management reviews from the API', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ManagementReviewList />
      </QueryClientProvider>
    );

    // Check that the mock data is displayed
    await waitFor(() => {
      expect(screen.getByText('Q1 Management Review Meeting')).toBeInTheDocument();
      expect(screen.getByText('Q2 Management Review Meeting')).toBeInTheDocument();
      expect(screen.getByText('Special Review - New Product Line')).toBeInTheDocument();
    });

    // Check that the status badges are displayed correctly
    const scheduledBadge = screen.getByText('scheduled');
    const inProgressBadge = screen.getByText('in-progress');
    const completedBadge = screen.getByText('completed');
    
    expect(scheduledBadge).toBeInTheDocument();
    expect(inProgressBadge).toBeInTheDocument();
    expect(completedBadge).toBeInTheDocument();
  });

  it('should navigate to the review detail page when clicking on a review', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ManagementReviewList />
      </QueryClientProvider>
    );

    // Wait for the reviews to be displayed
    await waitFor(() => {
      expect(screen.getByText('Q1 Management Review Meeting')).toBeInTheDocument();
    });

    // Click on a review
    fireEvent.click(screen.getByText('Q1 Management Review Meeting'));

    // Check that it navigated to the detail page
    expect(navigateTo).toHaveBeenCalledWith('/management-review/1');
  });

  it('should navigate to the create page when clicking Schedule Review button', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ManagementReviewList />
      </QueryClientProvider>
    );

    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByText('Schedule Review')).toBeInTheDocument();
    });

    // Click the Schedule Review button
    fireEvent.click(screen.getByText('Schedule Review'));

    // Check that it navigated to the create page
    expect(navigateTo).toHaveBeenCalledWith('/management-review/create');
  });

  it('should filter management reviews by status', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ManagementReviewList />
      </QueryClientProvider>
    );

    // Wait for the reviews to be displayed
    await waitFor(() => {
      expect(screen.getByText('Q1 Management Review Meeting')).toBeInTheDocument();
    });

    // Click on the "Completed" filter tab
    fireEvent.click(screen.getByText('Completed'));

    // Only the completed review should be visible
    expect(screen.queryByText('Q1 Management Review Meeting')).not.toBeInTheDocument();
    expect(screen.queryByText('Q2 Management Review Meeting')).not.toBeInTheDocument();
    expect(screen.getByText('Special Review - New Product Line')).toBeInTheDocument();
  });
});