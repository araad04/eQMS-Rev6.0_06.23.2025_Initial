/**
 * Bug Fix SUP007: Automatic Supplier Requalification & Audit Date Calculation
 * Test Suite for ISO 13485:2016 & IEC 62304 Compliance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  calculateRequalificationDate, 
  calculateNextAuditDate, 
  getSupplierComplianceStatus,
  validateCriticality,
  isRequalificationDue,
  isAuditDue
} from '../utils/supplier-lifecycle';

describe('SUP007: Supplier Lifecycle Management', () => {
  
  describe('Requalification Date Calculation', () => {
    it('should calculate Critical supplier requalification date (1 year)', () => {
      const qualificationDate = new Date('2024-01-15');
      const expected = new Date('2025-01-15');
      
      const result = calculateRequalificationDate(qualificationDate, 'Critical');
      
      expect(result.getFullYear()).toBe(expected.getFullYear());
      expect(result.getMonth()).toBe(expected.getMonth());
      expect(result.getDate()).toBe(expected.getDate());
    });

    it('should calculate Major supplier requalification date (2 years)', () => {
      const qualificationDate = new Date('2024-01-15');
      const expected = new Date('2026-01-15');
      
      const result = calculateRequalificationDate(qualificationDate, 'Major');
      
      expect(result.getFullYear()).toBe(expected.getFullYear());
      expect(result.getMonth()).toBe(expected.getMonth());
      expect(result.getDate()).toBe(expected.getDate());
    });

    it('should calculate Minor supplier requalification date (4 years)', () => {
      const qualificationDate = new Date('2024-01-15');
      const expected = new Date('2028-01-15');
      
      const result = calculateRequalificationDate(qualificationDate, 'Minor');
      
      expect(result.getFullYear()).toBe(expected.getFullYear());
      expect(result.getMonth()).toBe(expected.getMonth());
      expect(result.getDate()).toBe(expected.getDate());
    });

    it('should throw error for invalid criticality', () => {
      const qualificationDate = new Date('2024-01-15');
      
      expect(() => {
        calculateRequalificationDate(qualificationDate, 'Invalid');
      }).toThrow('Invalid criticality level: Invalid. Must be Critical, Major, or Minor.');
    });
  });

  describe('Audit Date Calculation', () => {
    it('should calculate Critical supplier audit date (1 year)', () => {
      const lastAuditDate = new Date('2024-01-15');
      const expected = new Date('2025-01-15');
      
      const result = calculateNextAuditDate(lastAuditDate, 'Critical');
      
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(expected.getFullYear());
      expect(result!.getMonth()).toBe(expected.getMonth());
      expect(result!.getDate()).toBe(expected.getDate());
    });

    it('should calculate Major supplier audit date (3 years)', () => {
      const lastAuditDate = new Date('2024-01-15');
      const expected = new Date('2027-01-15');
      
      const result = calculateNextAuditDate(lastAuditDate, 'Major');
      
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(expected.getFullYear());
      expect(result!.getMonth()).toBe(expected.getMonth());
      expect(result!.getDate()).toBe(expected.getDate());
    });

    it('should return null for Minor supplier (no audit required)', () => {
      const lastAuditDate = new Date('2024-01-15');
      
      const result = calculateNextAuditDate(lastAuditDate, 'Minor');
      
      expect(result).toBeNull();
    });
  });

  describe('Compliance Status Assessment', () => {
    it('should identify compliant Critical supplier', () => {
      const qualificationDate = new Date('2024-01-15');
      const requalificationDate = new Date('2025-01-15');
      const lastAuditDate = new Date('2024-01-15');
      const nextAuditDate = new Date('2025-01-15');
      
      const result = getSupplierComplianceStatus(
        qualificationDate,
        requalificationDate,
        lastAuditDate,
        nextAuditDate,
        'Critical'
      );
      
      expect(result.status).toBe('compliant');
      expect(result.issues).toHaveLength(0);
      expect(result.nextActions).toHaveLength(0);
    });

    it('should identify supplier needing requalification', () => {
      const qualificationDate = new Date('2023-01-15');
      const requalificationDate = new Date('2024-01-15'); // Past due
      const lastAuditDate = new Date('2024-01-15');
      const nextAuditDate = new Date('2025-01-15');
      
      const result = getSupplierComplianceStatus(
        qualificationDate,
        requalificationDate,
        lastAuditDate,
        nextAuditDate,
        'Critical'
      );
      
      expect(result.status).toBe('warning');
      expect(result.issues).toContain('Requalification is due or overdue');
      expect(result.nextActions).toContain('Conduct critical supplier requalification');
    });

    it('should identify unqualified supplier', () => {
      const result = getSupplierComplianceStatus(
        null, // No qualification date
        null,
        null,
        null,
        'Critical'
      );
      
      expect(result.status).toBe('non-compliant');
      expect(result.issues).toContain('Supplier not yet qualified');
      expect(result.nextActions).toContain('Complete initial supplier qualification');
    });
  });

  describe('Due Date Validation', () => {
    it('should correctly identify requalification due within 30 days', () => {
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + 15); // 15 days from now
      
      const result = isRequalificationDue(dueDate);
      
      expect(result).toBe(true);
    });

    it('should correctly identify requalification not due yet', () => {
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + 45); // 45 days from now
      
      const result = isRequalificationDue(dueDate);
      
      expect(result).toBe(false);
    });

    it('should correctly identify audit due within 30 days', () => {
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + 20); // 20 days from now
      
      const result = isAuditDue(dueDate);
      
      expect(result).toBe(true);
    });

    it('should return false for null audit date (Minor suppliers)', () => {
      const result = isAuditDue(null);
      
      expect(result).toBe(false);
    });
  });

  describe('Criticality Validation', () => {
    it('should validate correct criticality levels', () => {
      expect(validateCriticality('Critical')).toBe(true);
      expect(validateCriticality('Major')).toBe(true);
      expect(validateCriticality('Minor')).toBe(true);
    });

    it('should reject invalid criticality levels', () => {
      expect(validateCriticality('Invalid')).toBe(false);
      expect(validateCriticality('High')).toBe(false);
      expect(validateCriticality('Low')).toBe(false);
      expect(validateCriticality('')).toBe(false);
    });
  });
});