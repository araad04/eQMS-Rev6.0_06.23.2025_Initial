
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { 
  insertCapaSchema, 
  insertDesignProjectSchema,
  insertVerificationPlanSchema,
  insertValidationPlanSchema,
  insertNonconformingProductSchema
} from '@shared/schema';

describe('Schema Validation Tests', () => {
  describe('CAPA Schema', () => {
    it('should validate correct CAPA data', () => {
      const validCapa = {
        title: "Test CAPA",
        description: "Test description",
        typeId: 1,
        statusId: 1,
        initiatedBy: 1,
        source: "audit",
        riskPriority: "high",
        patientSafetyImpact: true,
        productPerformanceImpact: true,
        complianceImpact: false
      };
      
      expect(() => insertCapaSchema.parse(validCapa)).not.toThrow();
    });

    it('should reject invalid CAPA data', () => {
      const invalidCapa = {
        // Missing required fields
        title: "",
        description: "",
      };
      
      expect(() => insertCapaSchema.parse(invalidCapa)).toThrow();
    });
  });

  describe('Design Control Schema', () => {
    it('should validate correct design project data', () => {
      const validProject = {
        title: "Medical Device X",
        description: "New device development",
        typeId: 1,
        statusId: 1,
        modelTypeId: 1,
        riskClassId: 1,
        hasSoftwareComponent: true,
        initiatedBy: 1,
        projectManager: 1,
        targetCompletionDate: new Date().toISOString()
      };
      
      expect(() => insertDesignProjectSchema.parse(validProject)).not.toThrow();
    });
  });

  describe('V&V Schema', () => {
    it('should validate verification plan data', () => {
      const validVerification = {
        projectId: 1,
        planCode: "VER-001",
        title: "Functionality Test",
        description: "Testing core functions",
        method: "test",
        acceptanceCriteria: "All tests pass",
        status: "draft",
        createdBy: 1
      };
      
      expect(() => insertVerificationPlanSchema.parse(validVerification)).not.toThrow();
    });

    it('should validate validation plan data', () => {
      const validValidation = {
        projectId: 1,
        planCode: "VAL-001", 
        title: "User Needs Validation",
        description: "Validating user requirements",
        method: "user_study",
        acceptanceCriteria: "90% user satisfaction",
        status: "draft",
        createdBy: 1
      };
      
      expect(() => insertValidationPlanSchema.parse(validValidation)).not.toThrow();
    });
  });

  describe('Nonconforming Product Schema', () => {
    it('should validate nonconforming product data', () => {
      const validProduct = {
        ncpId: "NCP-2024-001",
        batchId: 1,
        productId: 1,
        detectedAt: new Date().toISOString(),
        detectedBy: 1,
        detectionStage: "in-process",
        description: "Test description",
        severityId: 1,
        batchNumber: "BATCH-001"
      };
      
      expect(() => insertNonconformingProductSchema.parse(validProduct)).not.toThrow();
    });
  });
});
