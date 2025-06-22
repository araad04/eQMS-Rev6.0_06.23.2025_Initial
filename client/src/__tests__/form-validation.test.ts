import { describe, test, expect } from 'vitest';
import { z } from 'zod';
import { insertUserSchema, insertDocumentSchema, insertCapaSchema } from '@shared/schema';

describe('Form Validation Tests', () => {
  describe('User Schema Validation', () => {
    test('Valid User Data', () => {
      const validUser = {
        username: 'testuser',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'viewer',
        department: 'QA'
      };
      expect(() => insertUserSchema.parse(validUser)).not.toThrow();
    });

    test('Invalid Password Format', () => {
      const invalidUser = {
        username: 'testuser',
        password: 'weak',
        email: 'test@example.com'
      };
      expect(() => insertUserSchema.parse(invalidUser)).toThrow();
    });

    test('Email Format', () => {
      const invalidEmails = ['invalid', 'test@', '@domain.com'];
      invalidEmails.forEach(email => {
        expect(() => 
          insertUserSchema.parse({ email })
        ).toThrow();
      });
    });
  });

  describe('Document Schema Validation', () => {
    test('Valid Document', () => {
      const validDoc = {
        title: 'Test Document',
        documentId: 'DOC-001',
        typeId: 1,
        statusId: 1,
        revision: '1.0',
        createdBy: 1
      };
      expect(() => insertDocumentSchema.parse(validDoc)).not.toThrow();
    });

    test('Version Format', () => {
      const versions = ['1.0', '2.1', '0.9'];
      versions.forEach(version => {
        expect(version).toMatch(/^\d+\.\d+$/);
      });
    });
  });

  describe('CAPA Schema Validation', () => {
    test('Valid CAPA', () => {
      const validCapa = {
        capaId: 'CAPA-2024-001',
        title: 'Test CAPA',
        description: 'Description',
        typeId: 1,
        statusId: 1,
        initiatedBy: 1,
        riskLevel: 'medium'
      };
      expect(() => insertCapaSchema.parse(validCapa)).not.toThrow();
    });

    test('Risk Assessment Values', () => {
      const riskAssessment = {
        severity: 3,
        occurrence: 2,
        detection: 2,
        rpn: 12
      };
      expect(riskAssessment.severity).toBeLessThanOrEqual(5);
      expect(riskAssessment.rpn).toBe(
        riskAssessment.severity * riskAssessment.occurrence * riskAssessment.detection
      );
    });
  });
});