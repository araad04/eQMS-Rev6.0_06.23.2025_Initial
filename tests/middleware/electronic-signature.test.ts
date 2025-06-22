import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Response, NextFunction } from 'express';
import { verifyElectronicSignature } from '../../server/middleware/electronic-signature';
import { storage } from '../../server/storage';

// Skip type checking for tests since we're using mocks
// @ts-ignore
const mockMiddleware = verifyElectronicSignature;

// Mock the storage
vi.mock('../../server/storage', () => ({
  storage: {
    getUser: vi.fn(),
  },
}));

// Mock the Logger
vi.mock('../../server/utils/logger', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the crypto module for password verification
vi.mock('crypto', () => ({
  scrypt: vi.fn((password, salt, keylen, callback) => {
    // Simplified mock of crypto's scrypt function that just creates a buffer
    const buffer = Buffer.from('mocked-hash');
    callback(null, buffer);
  }),
  timingSafeEqual: vi.fn(() => true), // Default to successful comparison
}));

describe('Electronic Signature Middleware', () => {
  let req: any;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup request, response, and next function
    jsonMock = vi.fn().mockReturnThis();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    
    req = {
      path: '/documents/1/approvals',
      user: { id: 1, username: 'testuser' },
      body: {
        password: 'TestPassword123',
        signatureReason: 'Document Approval',
      },
      ip: '127.0.0.1',
    };
    
    res = {
      status: statusMock,
      json: jsonMock,
    };
    
    next = vi.fn();
    
    // Setup storage mock to return a user
    (storage.getUser as any).mockResolvedValue({
      id: 1,
      username: 'testuser',
      password: 'mocked-hash.salt',
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Test 1: Verify middleware passes for valid requests
  it('should call next() for valid signature requests', async () => {
    await mockMiddleware(req, res as Response, next);
    
    expect(next).toHaveBeenCalled();
    expect(req.body.signatureMetadata).toBeDefined();
    expect(req.body.signatureMetadata.verifiedUserId).toBe(1);
  });

  // Test 2: Skip middleware if path doesn't include approvals
  it('should skip middleware if path does not include approvals', async () => {
    // Create a new request object with a different path
    const reqWithDifferentPath = {
      ...req,
      path: '/documents/1/versions'
    };
    
    await mockMiddleware(reqWithDifferentPath, res as Response, next);
    
    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  // Test 3: Skip middleware if user is not authenticated
  it('should skip middleware if user is not authenticated', async () => {
    const reqWithoutUser = {
      ...req,
      user: undefined
    };
    
    await mockMiddleware(reqWithoutUser, res as Response, next);
    
    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  // Test 4: Return 400 if password is missing
  it('should return 400 if password is missing', async () => {
    const reqWithoutPassword = {
      ...req,
      body: {
        ...req.body,
        password: undefined
      }
    };
    
    await mockMiddleware(reqWithoutPassword, res as Response, next);
    
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Electronic signature verification failed',
    }));
    expect(next).not.toHaveBeenCalled();
  });

  // Test 5: Return 400 if signature reason is missing
  it('should return 400 if signature reason is missing', async () => {
    const reqWithoutReason = {
      ...req,
      body: {
        ...req.body,
        signatureReason: undefined
      }
    };
    
    await mockMiddleware(reqWithoutReason, res as Response, next);
    
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Electronic signature verification failed',
    }));
    expect(next).not.toHaveBeenCalled();
  });

  // Test 6: Return 401 if user is not found
  it('should return 401 if user is not found', async () => {
    (storage.getUser as any).mockResolvedValue(undefined);
    
    await mockMiddleware(req, res as Response, next);
    
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Authentication failed',
    }));
    expect(next).not.toHaveBeenCalled();
  });

  // Test 7: Return 401 if password verification fails
  it('should return 401 if password verification fails', async () => {
    const timingSafeEqual = require('crypto').timingSafeEqual;
    timingSafeEqual.mockReturnValue(false);
    
    await mockMiddleware(req, res as Response, next);
    
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Electronic signature verification failed',
    }));
    expect(next).not.toHaveBeenCalled();
  });

  // Test 8: Handle error during execution
  it('should return 500 if an error occurs during execution', async () => {
    (storage.getUser as any).mockRejectedValue(new Error('Test error'));
    
    await mockMiddleware(req, res as Response, next);
    
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Electronic signature verification failed',
    }));
    expect(next).not.toHaveBeenCalled();
  });

  // Test 9: Verify signature metadata is added to request
  it('should add signature metadata to request body', async () => {
    await mockMiddleware(req, res as Response, next);
    
    expect(req.body.signatureMetadata).toBeDefined();
    expect(req.body.signatureMetadata).toEqual(expect.objectContaining({
      verifiedUserId: 1,
      verifiedUsername: 'testuser',
      reason: 'Document Approval',
      ipAddress: '127.0.0.1',
    }));
    expect(req.body.signatureMetadata.verificationTimestamp).toBeDefined();
  });
});