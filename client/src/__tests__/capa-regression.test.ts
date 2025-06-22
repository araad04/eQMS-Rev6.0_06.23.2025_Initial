
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import { capaFormSchema } from '@/pages/capa-create';
import { useCapaActions, useUpdateCapaAction, useMarkCapaAsReadyMutation } from '@/hooks/use-capa-actions';
import { renderHook, act } from '@testing-library/react-hooks';
import { queryClient } from '@/lib/queryClient';

describe('CAPA Module Comprehensive Tests', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  describe('CAPA Form Validation', () => {
    it('should validate a complete CAPA submission', () => {
      const validCapa = {
        title: 'Test CAPA',
        capaId: 'CAPA-2025-1234',
        description: 'Test CAPA description',
        typeId: 1,
        statusId: 1,
        initiatedBy: 1,
        source: 'customer_complaint',
        riskPriority: 'medium',
        patientSafetyImpact: false,
        productPerformanceImpact: false,
        complianceImpact: false,
        immediateContainment: false,
        rcaMethod: '5whys',
        assignedTo: 1,
        dueDate: new Date().toISOString(),
        rootCause: 'Test root cause',
        correctiveAction: 'Test corrective action',
        preventiveAction: 'Test preventive action'
      };
      expect(() => capaFormSchema.parse(validCapa)).not.toThrow();
    });

    it('should validate required fields', () => {
      const invalidCapa = {
        capaId: 'CAPA-2025-1234',
        description: 'Test description',
        typeId: 1,
        statusId: 1,
        initiatedBy: 1
      };
      expect(() => capaFormSchema.parse(invalidCapa)).toThrow();
    });

    it('should validate CAPA ID format', () => {
      const invalidCapaId = {
        title: 'Test CAPA',
        capaId: 'invalid-format',
        description: 'Test description',
        typeId: 1,
        statusId: 1,
        initiatedBy: 1,
        source: 'internal_audit',
        riskPriority: 'low',
        rcaMethod: '5whys'
      };
      expect(() => capaFormSchema.parse(invalidCapaId)).toThrow();
    });

    it('should validate risk priority values', () => {
      const invalidRiskPriority = {
        title: 'Test CAPA',
        capaId: 'CAPA-2025-1234',
        description: 'Test description',
        typeId: 1,
        statusId: 1,
        initiatedBy: 1,
        source: 'internal_audit',
        riskPriority: 'invalid_priority',
        rcaMethod: '5whys'
      };
      expect(() => capaFormSchema.parse(invalidRiskPriority)).toThrow();
    });
  });

  describe('CAPA Implementation Tests', () => {
    it('should test CAPA action creation', async () => {
      const mockAction = {
        title: 'Test Action',
        description: 'Test action description',
        type: 'corrective',
        assignedTo: 1,
        dueDate: new Date().toISOString()
      };

      // Mock API response
      global.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1, ...mockAction })
        })
      );

      const { result } = renderHook(() => useCapaActions(1));
      
      await act(async () => {
        await result.current.mutate({ capaId: 1, action: mockAction });
      });

      expect(result.current.isSuccess).toBe(true);
    });

    it('should test CAPA action update', async () => {
      const mockUpdate = {
        status: 'completed',
        completionDate: new Date().toISOString()
      };

      global.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1, ...mockUpdate })
        })
      );

      const { result } = renderHook(() => useUpdateCapaAction());
      
      await act(async () => {
        await result.current.mutate({ actionId: 1, data: mockUpdate });
      });

      expect(result.current.isSuccess).toBe(true);
    });

    it('should test marking CAPA as ready for effectiveness review', async () => {
      global.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1, readyForEffectivenessReview: true })
        })
      );

      const { result } = renderHook(() => useMarkCapaAsReadyMutation());
      
      await act(async () => {
        await result.current.mutate(1);
      });

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('CAPA Workflow Tests', () => {
    it('should validate complete CAPA lifecycle', async () => {

describe('CAPA Effectiveness Testing', () => {
  it('should validate effectiveness criteria properly', () => {
    const validData = {
      criteria: [{
        id: 1,
        description: "Test criterion",
        target: 95,
        actual: 97,
        status: "met",
        evidence: "Test evidence"
      }],
      verificationMethod: "audit",
      effectivenessScore: 100,
      verificationStatus: "completed"
    };
    
    expect(() => effectivenessSchema.parse(validData)).not.toThrow();
  });

  it('should reject invalid effectiveness data', () => {
    const invalidData = {
      criteria: [],
      verificationMethod: "invalid",
      effectivenessScore: 101
    };
    
    expect(() => effectivenessSchema.parse(invalidData)).toThrow();
  });
});

      // Create CAPA
      const newCapa = {
        title: 'Lifecycle Test CAPA',
        capaId: 'CAPA-2025-9999',
        description: 'Testing complete CAPA lifecycle',
        typeId: 1,
        statusId: 1,
        initiatedBy: 1,
        source: 'internal_audit',
        riskPriority: 'high',
        rcaMethod: '5whys'
      };
      
      expect(() => capaFormSchema.parse(newCapa)).not.toThrow();

      // Add actions
      const action = {
        title: 'Lifecycle Test Action',
        description: 'Test action for lifecycle',
        type: 'corrective',
        assignedTo: 1,
        dueDate: new Date().toISOString()
      };

      global.fetch = vi.fn()
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1, ...action })
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            id: 1, 
            status: 'completed',
            completionDate: new Date().toISOString()
          })
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            id: 1, 
            readyForEffectivenessReview: true 
          })
        }));

      // Test complete workflow
      const { result: actionResult } = renderHook(() => useCapaActions(1));
      const { result: updateResult } = renderHook(() => useUpdateCapaAction());
      const { result: readyResult } = renderHook(() => useMarkCapaAsReadyMutation());

      await act(async () => {
        await actionResult.current.mutate({ capaId: 1, action });
        await updateResult.current.mutate({ 
          actionId: 1, 
          data: { status: 'completed' } 
        });
        await readyResult.current.mutate(1);
      });

      expect(actionResult.current.isSuccess).toBe(true);
      expect(updateResult.current.isSuccess).toBe(true);
      expect(readyResult.current.isSuccess).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid CAPA creation', async () => {
      const invalidCapa = {
        title: '', // Invalid empty title
        capaId: 'INVALID',
        description: '',
        typeId: 999, // Invalid type
        statusId: 1
      };
      
      expect(() => capaFormSchema.parse(invalidCapa)).toThrow();
    });

    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        })
      );

      const { result } = renderHook(() => useCapaActions(1));
      
      await act(async () => {
        await result.current.mutate({ 
          capaId: 1, 
          action: {
            title: 'Test Action',
            description: 'Test',
            type: 'corrective',
            assignedTo: 1
          }
        });
      });

      expect(result.current.isError).toBe(true);
    });
  });
});
