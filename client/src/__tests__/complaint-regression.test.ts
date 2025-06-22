
import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { complaintFormSchema } from '@/pages/complaint-create';

describe('Complaint Management Regression Tests', () => {
  describe('Complaint Form Validation', () => {
    it('should validate a complete complaint submission', () => {
      const validComplaint = {
        complaintNumber: 'COMP-2025-1234',
        customerName: 'Test Customer',
        customerContact: 'test@example.com',
        description: 'Test complaint description',
        category: 'product_defect',
        severity: 3,
        isReportable: false,
        status: 'open'
      };
      expect(() => complaintFormSchema.parse(validComplaint)).not.toThrow();
    });

    it('should reject invalid email format', () => {
      const invalidComplaint = {
        complaintNumber: 'COMP-2025-1234',
        customerName: 'Test Customer',
        customerContact: 'invalid-email',
        description: 'Test description',
        category: 'product_defect',
        severity: 3,
        isReportable: false,
        status: 'open'
      };
      expect(() => complaintFormSchema.parse(invalidComplaint)).toThrow();
    });

    it('should require minimum description length', () => {
      const invalidComplaint = {
        complaintNumber: 'COMP-2025-1234',
        customerName: 'Test Customer',
        customerContact: 'test@example.com',
        description: 'Short',
        category: 'product_defect',
        severity: 3,
        isReportable: false,
        status: 'open'
      };
      expect(() => complaintFormSchema.parse(invalidComplaint)).toThrow();
    });
  });
});
