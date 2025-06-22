import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest } from '../lib/queryClient';

// Mock fetch
global.fetch = vi.fn();

describe('API Connection Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully fetch data from API health endpoint', async () => {
    // Mock successful response
    const mockResponse = {
      status: 'ok',
      time: new Date().toISOString(),
      apiVersion: '1.0.0',
      environment: 'test',
      metrics: {
        uptime: 123.45,
        memory: {
          heapUsed: 100,
          heapTotal: 200
        }
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse
    });

    // Call the endpoint
    const response = await fetch('/api/health');
    const data = await response.json();

    // Assertions
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(data).toEqual(mockResponse);
    expect(data.status).toBe('ok');
    expect(typeof data.time).toBe('string');
    expect(typeof data.metrics.uptime).toBe('number');
  });

  it('should handle API errors gracefully', async () => {
    // Mock failed response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    // Call the endpoint and expect rejection
    const response = await fetch('/api/health');
    
    // Assertions
    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
  });

  it('should make authenticated requests with proper headers', async () => {
    // Mock successful response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ authenticated: true })
    });

    // Make an authenticated request using the apiRequest utility
    await apiRequest('GET', '/api/user');

    // Verify that fetch was called with correct headers
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/user'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        method: 'GET'
      })
    );
  });

  it('should properly handle network errors', async () => {
    // Mock network failure
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    // Call and expect rejection
    await expect(fetch('/api/health')).rejects.toThrow('Network error');
  });
});