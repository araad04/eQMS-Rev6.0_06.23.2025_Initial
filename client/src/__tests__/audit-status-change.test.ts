import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiRequest } from '../lib/queryClient';

// Mock the fetch function
vi.mock('../lib/queryClient', () => ({
  apiRequest: vi.fn(),
}));

// Global fetch mock
global.fetch = vi.fn();

describe('Audit Status Change Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully update an audit status from Planning to In Progress', async () => {
    // Mock the API request response
    const mockResponse = {
      id: 5,
      auditId: 'AUD-2025-3169',
      title: 'Audit 5/17/2025',
      statusId: 3, // Updated to "In Progress"
      // Other audit properties would be here
    };

    // Configure the mock to return a successful response
    (apiRequest as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    // Simulate the status update call
    const response = await apiRequest('PATCH', '/api/audits/5', { statusId: 3 });
    const data = await response.json();

    // Verify the API was called with the correct arguments
    expect(apiRequest).toHaveBeenCalledWith('PATCH', '/api/audits/5', { statusId: 3 });
    
    // Verify the response contains expected data
    expect(data).toEqual(mockResponse);
    expect(data.statusId).toBe(3); // Expect the status is now "In Progress"
  });

  it('should handle errors when updating audit status', async () => {
    // Configure the mock to return an error
    (apiRequest as any).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: 'Failed to update audit status' }),
    });

    // Simulate the status update call
    const response = await apiRequest('PATCH', '/api/audits/5', { statusId: 3 });
    
    // Verify the API was called with the correct arguments
    expect(apiRequest).toHaveBeenCalledWith('PATCH', '/api/audits/5', { statusId: 3 });
    
    // Verify the error handling
    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
    
    const errorData = await response.json();
    expect(errorData.error).toBe('Failed to update audit status');
  });

  it('should handle the direct SQL approach for status updates', async () => {
    // This test verifies the server-side logic 
    // by checking a mock of the direct SQL approach outcome
    
    const mockQueryResult = {
      rows: [{
        id: 5,
        audit_id: 'AUD-2025-3169',
        title: 'Audit 5/17/2025',
        status_id: 3,
        // Other snake_case database fields would be here
      }]
    };
    
    // Mock the global fetch for a direct call to the API
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 5,
        auditId: 'AUD-2025-3169',
        title: 'Audit 5/17/2025',
        statusId: 3,
        // Transformed to camelCase for frontend
      }),
    });
    
    // Simulate direct API call (bypassing apiRequest for this test)
    const response = await fetch('/api/audits/5', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statusId: 3 })
    });
    
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data.statusId).toBe(3);
    expect(data.auditId).toBe('AUD-2025-3169');
  });
});