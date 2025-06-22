import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  scheduleSupplierAssessment, 
  checkAndScheduleAssessments,
  initializeSupplierAssessmentScheduler
} from '../utils/supplier-assessment-scheduler';
import { Logger } from '../utils/logger';
import * as supplierStorage from '../storage.supplier';

// Mock the required dependencies
vi.mock('../utils/logger', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}));

vi.mock('../storage.supplier', () => ({
  getSupplier: vi.fn(),
  getLatestSupplierAssessment: vi.fn(),
  createSupplierAssessment: vi.fn(),
  getActiveSuppliers: vi.fn(),
  getSupplierAssessments: vi.fn()
}));

describe('Supplier Assessment Scheduler', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('scheduleSupplierAssessment', () => {
    test('should successfully schedule assessment for Critical supplier', async () => {
      // Mock data
      const supplierId = 1;
      const supplier = {
        id: supplierId,
        name: 'Critical Supplier Inc.',
        criticality: 'Critical',
        currentRiskLevel: 'Medium'
      };
      const mockCreatedAssessment = {
        id: 100,
        supplierId,
        assessmentType: 'Risk Assessment',
        status: 'Scheduled'
      };

      // Setup mocks
      vi.mocked(supplierStorage.getSupplier).mockResolvedValue(supplier);
      vi.mocked(supplierStorage.getLatestSupplierAssessment).mockResolvedValue(null);
      vi.mocked(supplierStorage.createSupplierAssessment).mockResolvedValue(mockCreatedAssessment);

      // Execute
      const result = await scheduleSupplierAssessment(supplierId);

      // Assertions
      expect(result).toBe(true);
      expect(supplierStorage.getSupplier).toHaveBeenCalledWith(supplierId);
      expect(supplierStorage.getLatestSupplierAssessment).toHaveBeenCalledWith(supplierId);
      expect(supplierStorage.createSupplierAssessment).toHaveBeenCalledWith(
        expect.objectContaining({
          supplierId,
          assessmentType: 'Risk Assessment',
          status: 'Scheduled'
        })
      );
      expect(Logger.info).toHaveBeenCalledWith(expect.stringContaining('Successfully scheduled assessment'));
    });

    test('should successfully schedule assessment for Major supplier with High risk', async () => {
      // Mock data
      const supplierId = 2;
      const supplier = {
        id: supplierId,
        name: 'Major High Risk Supplier',
        criticality: 'Major',
        currentRiskLevel: 'High'
      };
      const mockCreatedAssessment = {
        id: 101,
        supplierId,
        assessmentType: 'Risk Assessment',
        status: 'Scheduled'
      };

      // Setup mocks
      vi.mocked(supplierStorage.getSupplier).mockResolvedValue(supplier);
      vi.mocked(supplierStorage.getLatestSupplierAssessment).mockResolvedValue(null);
      vi.mocked(supplierStorage.createSupplierAssessment).mockResolvedValue(mockCreatedAssessment);

      // Execute
      const result = await scheduleSupplierAssessment(supplierId);

      // Assertions
      expect(result).toBe(true);
      expect(supplierStorage.getSupplier).toHaveBeenCalledWith(supplierId);
      expect(supplierStorage.getLatestSupplierAssessment).toHaveBeenCalledWith(supplierId);
      expect(supplierStorage.createSupplierAssessment).toHaveBeenCalledWith(
        expect.objectContaining({
          supplierId,
          assessmentType: 'Risk Assessment',
          status: 'Scheduled'
        })
      );
      expect(Logger.info).toHaveBeenCalledWith(expect.stringContaining('Successfully scheduled assessment'));
    });

    test('should return false when supplier not found', async () => {
      // Setup mocks
      vi.mocked(supplierStorage.getSupplier).mockResolvedValue(null);

      // Execute
      const result = await scheduleSupplierAssessment(999);

      // Assertions
      expect(result).toBe(false);
      expect(Logger.error).toHaveBeenCalledWith(expect.stringContaining('Cannot schedule assessment: Supplier with ID 999 not found'));
      expect(supplierStorage.createSupplierAssessment).not.toHaveBeenCalled();
    });

    test('should handle database errors during assessment creation', async () => {
      // Mock data
      const supplierId = 3;
      const supplier = {
        id: supplierId,
        name: 'Standard Supplier',
        criticality: 'Minor',
        currentRiskLevel: 'Low'
      };

      // Setup mocks
      vi.mocked(supplierStorage.getSupplier).mockResolvedValue(supplier);
      vi.mocked(supplierStorage.getLatestSupplierAssessment).mockResolvedValue(null);
      vi.mocked(supplierStorage.createSupplierAssessment).mockRejectedValue(new Error('Database connection error'));

      // Execute
      const result = await scheduleSupplierAssessment(supplierId);

      // Assertions
      expect(result).toBe(false);
      expect(Logger.error).toHaveBeenCalledWith(expect.stringContaining('Database error when creating supplier assessment'));
    });
  });

  describe('checkAndScheduleAssessments', () => {
    test('should successfully schedule assessments for multiple suppliers', async () => {
      // Mock data
      const mockSuppliers = [
        { id: 1, name: 'Critical Supplier', criticality: 'Critical', currentRiskLevel: 'Medium' },
        { id: 2, name: 'Major High Risk', criticality: 'Major', currentRiskLevel: 'High' },
        { id: 3, name: 'Standard Supplier', criticality: 'Minor', currentRiskLevel: 'Low' }
      ];

      // Setup mocks
      vi.mocked(supplierStorage.getActiveSuppliers).mockResolvedValue(mockSuppliers);
      vi.mocked(supplierStorage.getLatestSupplierAssessment).mockResolvedValue(null);
      
      // Mock the schedule function to always return success
      const originalScheduleSupplierAssessment = global.scheduleSupplierAssessment;
      global.scheduleSupplierAssessment = vi.fn().mockResolvedValue(true);

      // Execute
      const result = await checkAndScheduleAssessments();

      // Restore original function
      global.scheduleSupplierAssessment = originalScheduleSupplierAssessment;

      // Assertions
      expect(result).toBe(3);
      expect(supplierStorage.getActiveSuppliers).toHaveBeenCalled();
      expect(Logger.info).toHaveBeenCalledWith(expect.stringContaining('scheduled'));
    });

    test('should handle empty supplier list', async () => {
      // Setup mocks
      vi.mocked(supplierStorage.getActiveSuppliers).mockResolvedValue([]);

      // Execute
      const result = await checkAndScheduleAssessments();

      // Assertions
      expect(result).toBe(0);
      expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('No active suppliers found'));
    });

    test('should handle errors during supplier retrieval', async () => {
      // Setup mocks
      vi.mocked(supplierStorage.getActiveSuppliers).mockRejectedValue(new Error('Database error'));

      // Execute
      const result = await checkAndScheduleAssessments();

      // Assertions
      expect(result).toBe(0);
      expect(Logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to check and schedule supplier assessments'));
    });
  });

  describe('initializeSupplierAssessmentScheduler', () => {
    test('should initialize scheduler when suppliers exist', async () => {
      // Setup mocks
      vi.mocked(supplierStorage.getActiveSuppliers).mockResolvedValue([
        { id: 1, name: 'Test Supplier' }
      ]);

      // Mock setTimeout
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn() as any;

      // Execute
      await initializeSupplierAssessmentScheduler();

      // Assertions
      expect(Logger.info).toHaveBeenCalledWith(expect.stringContaining('Initializing supplier assessment scheduler'));
      expect(Logger.info).toHaveBeenCalledWith(expect.stringContaining('Found 1 suppliers in the system'));
      expect(global.setTimeout).toHaveBeenCalled();

      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
    });

    test('should not initialize scheduler when no suppliers exist', async () => {
      // Setup mocks
      vi.mocked(supplierStorage.getActiveSuppliers).mockResolvedValue([]);

      // Execute
      await initializeSupplierAssessmentScheduler();

      // Assertions
      expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('No suppliers found in the system'));
    });

    test('should handle errors during initialization', async () => {
      // Setup mocks
      vi.mocked(supplierStorage.getActiveSuppliers).mockRejectedValue(new Error('Database connection error'));

      // Execute
      await initializeSupplierAssessmentScheduler();

      // Assertions
      expect(Logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to initialize supplier assessment scheduler'));
    });
  });
});