import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { setupSupplierRoutes } from '../routes.supplier';
import * as supplierStorage from '../storage.supplier';
import * as schedulerModule from '../utils/supplier-assessment-scheduler';

// Mock authentication middleware to bypass authentication for tests
vi.mock('express', async () => {
  const actual = await vi.importActual('express');
  return {
    ...actual,
    // Add a mock isAuthenticated middleware that always passes
    isAuthenticated: (_req: any, _res: any, next: any) => next()
  };
});

// Mock the supplier storage methods
vi.mock('../storage.supplier', () => ({
  getSuppliers: vi.fn(),
  getSupplier: vi.fn(),
  getSupplierAssessments: vi.fn(),
  createSupplierAssessment: vi.fn()
}));

// Mock the scheduler functions
vi.mock('../utils/supplier-assessment-scheduler', () => ({
  scheduleSupplierAssessment: vi.fn(),
  checkAndScheduleAssessments: vi.fn()
}));

// Mock the logger
vi.mock('../utils/logger', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('Supplier Assessment API Integration Tests', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock req.user for authenticated endpoints
    app.use((req, _res, next) => {
      req.user = {
        id: 1,
        username: 'admin',
        role: 'admin'
      };
      req.isAuthenticated = () => true;
      next();
    });
    
    // Set up the supplier routes
    setupSupplierRoutes(app);
    
    // Reset all mocks
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/supplier-assessments', () => {
    test('should return all supplier assessments', async () => {
      // Mock data
      const mockAssessments = [
        { 
          id: 1, 
          supplierId: 1, 
          assessmentType: 'Risk Assessment', 
          status: 'Scheduled',
          scheduledDate: new Date('2025-06-01')
        },
        {
          id: 2,
          supplierId: 2,
          assessmentType: 'Quality Audit',
          status: 'Completed',
          scheduledDate: new Date('2025-05-15')
        }
      ];
      
      // Mock supplier data for each assessment
      const mockSuppliers = [
        { id: 1, name: 'Critical Supplier Inc.' },
        { id: 2, name: 'Standard Supplier Co.' }
      ];
      
      // Setup mocks
      vi.mocked(supplierStorage.getSupplierAssessments).mockResolvedValue(mockAssessments);
      vi.mocked(supplierStorage.getSupplier)
        .mockResolvedValueOnce(mockSuppliers[0])
        .mockResolvedValueOnce(mockSuppliers[1]);
      
      // Execute the request
      const response = await request(app).get('/api/supplier-assessments');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('supplier_name', 'Critical Supplier Inc.');
      expect(response.body[1]).toHaveProperty('supplier_name', 'Standard Supplier Co.');
    });
    
    test('should handle errors gracefully', async () => {
      // Setup mocks to simulate an error
      vi.mocked(supplierStorage.getSupplierAssessments).mockRejectedValue(new Error('Database error'));
      
      // Execute the request
      const response = await request(app).get('/api/supplier-assessments');
      
      // Assertions
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to retrieve supplier assessments');
    });
  });
  
  describe('POST /api/supplier-assessments', () => {
    test('should create a new supplier assessment', async () => {
      // Mock data
      const newAssessment = {
        supplierId: 1,
        assessmentType: 'Risk Assessment',
        scheduledDate: new Date('2025-06-15'),
        status: 'Scheduled'
      };
      
      const createdAssessment = {
        id: 3,
        ...newAssessment,
        createdBy: 1,
        createdAt: new Date()
      };
      
      // Setup mocks
      vi.mocked(supplierStorage.createSupplierAssessment).mockResolvedValue(createdAssessment);
      
      // Execute the request
      const response = await request(app)
        .post('/api/supplier-assessments')
        .send(newAssessment);
      
      // Assertions
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 3);
      expect(response.body).toHaveProperty('supplierId', 1);
      expect(response.body).toHaveProperty('assessmentType', 'Risk Assessment');
    });
    
    test('should handle validation errors', async () => {
      // Invalid assessment data (missing required fields)
      const invalidAssessment = {
        assessmentType: 'Risk Assessment'
        // Missing supplierId and scheduledDate
      };
      
      // Execute the request
      const response = await request(app)
        .post('/api/supplier-assessments')
        .send(invalidAssessment);
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Failed to create supplier assessment');
    });
  });
  
  describe('POST /api/suppliers/:id/trigger-assessment', () => {
    test('should trigger an assessment for a supplier', async () => {
      // Mock data
      const supplierId = 1;
      const supplier = {
        id: supplierId,
        name: 'Critical Medical Supplier',
        criticality: 'Critical',
        currentRiskLevel: 'Medium'
      };
      
      // Setup mocks
      vi.mocked(supplierStorage.getSupplier).mockResolvedValue(supplier);
      vi.mocked(schedulerModule.scheduleSupplierAssessment).mockResolvedValue(true);
      
      // Execute the request
      const response = await request(app).post(`/api/suppliers/${supplierId}/trigger-assessment`);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Assessment scheduled successfully');
      expect(response.body).toHaveProperty('supplierName', 'Critical Medical Supplier');
      expect(response.body).toHaveProperty('supplierType', 'Critical');
      expect(schedulerModule.scheduleSupplierAssessment).toHaveBeenCalledWith(supplierId);
    });
    
    test('should handle supplier not found', async () => {
      // Setup mocks
      vi.mocked(supplierStorage.getSupplier).mockResolvedValue(null);
      
      // Execute the request
      const response = await request(app).post('/api/suppliers/999/trigger-assessment');
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Supplier not found');
      expect(schedulerModule.scheduleSupplierAssessment).not.toHaveBeenCalled();
    });
    
    test('should handle assessment scheduling failure', async () => {
      // Mock data
      const supplierId = 2;
      const supplier = {
        id: supplierId,
        name: 'Problem Supplier',
        criticality: 'Major',
        currentRiskLevel: 'Medium'
      };
      
      // Setup mocks
      vi.mocked(supplierStorage.getSupplier).mockResolvedValue(supplier);
      vi.mocked(schedulerModule.scheduleSupplierAssessment).mockResolvedValue(false);
      
      // Execute the request
      const response = await request(app).post(`/api/suppliers/${supplierId}/trigger-assessment`);
      
      // Assertions
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to schedule assessment');
    });
  });
  
  describe('POST /api/admin/supplier-assessments/schedule-all', () => {
    test('should schedule all needed assessments', async () => {
      // Mock data - scheduled 2 assessments
      vi.mocked(schedulerModule.checkAndScheduleAssessments).mockResolvedValue(2);
      
      // Execute the request
      const response = await request(app).post('/api/admin/supplier-assessments/schedule-all');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Assessment scheduling completed');
      expect(response.body).toHaveProperty('scheduledCount', 2);
      expect(schedulerModule.checkAndScheduleAssessments).toHaveBeenCalled();
    });
    
    test('should handle scheduling errors', async () => {
      // Setup mocks to simulate an error
      vi.mocked(schedulerModule.checkAndScheduleAssessments).mockRejectedValue(new Error('Scheduler error'));
      
      // Execute the request
      const response = await request(app).post('/api/admin/supplier-assessments/schedule-all');
      
      // Assertions
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to schedule assessments');
    });
  });
  
  describe('GET /api/supplier-assessments/scheduler-status', () => {
    test('should return scheduler status and upcoming assessments', async () => {
      // Mock data
      const mockSuppliers = [
        { id: 1, name: 'Critical Supplier', criticality: 'Critical', currentRiskLevel: 'Medium' },
        { id: 2, name: 'Major Supplier', criticality: 'Major', currentRiskLevel: 'High' },
        { id: 3, name: 'Standard Supplier', criticality: 'Minor', currentRiskLevel: 'Low' }
      ];
      
      const now = new Date();
      const upcomingDate = new Date();
      upcomingDate.setDate(now.getDate() + 10);
      
      const mockAssessments = [
        { 
          id: 1, 
          supplierId: 1, 
          status: 'Scheduled', 
          scheduledDate: upcomingDate
        }
      ];
      
      // Setup mocks
      vi.mocked(supplierStorage.getSuppliers).mockResolvedValue(mockSuppliers);
      vi.mocked(supplierStorage.getSupplierAssessments).mockResolvedValue(mockAssessments);
      
      // Execute the request
      const response = await request(app).get('/api/supplier-assessments/scheduler-status');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'Scheduler is active');
      expect(response.body).toHaveProperty('supplierCounts.total', 3);
      expect(response.body).toHaveProperty('supplierCounts.critical', 1);
      expect(response.body).toHaveProperty('supplierCounts.majorHighRisk', 1);
      expect(response.body).toHaveProperty('assessmentsScheduled.next30Days', 1);
    });
    
    test('should handle errors gracefully', async () => {
      // Setup mocks to simulate an error
      vi.mocked(supplierStorage.getSuppliers).mockRejectedValue(new Error('Database error'));
      
      // Execute the request
      const response = await request(app).get('/api/supplier-assessments/scheduler-status');
      
      // Assertions
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to get scheduler status');
    });
  });
});