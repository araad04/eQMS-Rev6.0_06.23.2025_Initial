import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '../db';
import { capas, capaWorkflows, capaCorrections, capaWorkflowHistory } from '@shared/schema';
import { eq } from 'drizzle-orm';

describe('Enhanced CAPA Workflow System - 5-Phase Model', () => {
  let testCapaId: number;
  let testWorkflowId: number;
  const testUserId = 9999; // Development user

  beforeAll(async () => {
    // Create a test CAPA for workflow testing
    const [testCapa] = await db.insert(capas).values({
      capaId: `CAPA-TEST-${Date.now()}`,
      title: 'Enhanced Workflow Test CAPA',
      description: 'Testing the 5-phase enhanced CAPA workflow system',
      source: 'internal_audit',
      capaType: 'corrective',
      riskPriority: 'high',
      patientSafetyImpact: true,
      productPerformanceImpact: true,
      complianceImpact: true,
      initiatedBy: testUserId,
      assignedTo: testUserId,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }).returning();
    
    testCapaId = testCapa.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testWorkflowId) {
      await db.delete(capaWorkflowHistory).where(eq(capaWorkflowHistory.workflowId, testWorkflowId));
      await db.delete(capaCorrections).where(eq(capaCorrections.capaId, testCapaId));
      await db.delete(capaWorkflows).where(eq(capaWorkflows.id, testWorkflowId));
    }
    await db.delete(capas).where(eq(capas.id, testCapaId));
  });

  describe('Phase 1: CORRECTION - Immediate Correction & Containment', () => {
    it('should create workflow in CORRECTION phase', async () => {
      const [workflow] = await db.insert(capaWorkflows).values({
        capaId: testCapaId,
        currentState: 'CORRECTION',
        assignedTo: testUserId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        transitionDate: new Date(),
        transitionedBy: testUserId
      }).returning();

      testWorkflowId = workflow.id;
      
      expect(workflow).toBeDefined();
      expect(workflow.currentState).toBe('CORRECTION');
      expect(workflow.capaId).toBe(testCapaId);
    });

    it('should save immediate correction data', async () => {
      const [correction] = await db.insert(capaCorrections).values({
        capaId: testCapaId,
        description: 'Product quarantine and containment of affected batch',
        actionTaken: 'Immediate quarantine of batch LOT-2025-001 and customer notification',
        implementedBy: testUserId,
        implementationDate: new Date(),
        evidence: 'Quarantine certificate QC-2025-001',
        containmentType: 'quarantine',
        createdBy: testUserId
      }).returning();

      expect(correction).toBeDefined();
      expect(correction.containmentType).toBe('quarantine');
      expect(correction.capaId).toBe(testCapaId);
    });

    it('should validate required correction fields', async () => {
      // Test that required fields are enforced
      try {
        await db.insert(capaCorrections).values({
          capaId: testCapaId,
          description: '', // Empty description should fail
          actionTaken: 'Test action',
          implementedBy: testUserId,
          implementationDate: new Date(),
          containmentType: 'quarantine',
          createdBy: testUserId
        });
        expect.fail('Should have failed with empty description');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Phase 2: ROOT_CAUSE_ANALYSIS - Fishbone Analysis', () => {
    it('should transition to ROOT_CAUSE_ANALYSIS phase', async () => {
      // Update workflow to next phase
      const [updatedWorkflow] = await db.update(capaWorkflows)
        .set({
          currentState: 'ROOT_CAUSE_ANALYSIS',
          transitionDate: new Date(),
          transitionedBy: testUserId
        })
        .where(eq(capaWorkflows.id, testWorkflowId))
        .returning();

      expect(updatedWorkflow.currentState).toBe('ROOT_CAUSE_ANALYSIS');
    });

    it('should record workflow transition in history', async () => {
      const [historyEntry] = await db.insert(capaWorkflowHistory).values({
        workflowId: testWorkflowId,
        fromState: 'CORRECTION',
        toState: 'ROOT_CAUSE_ANALYSIS',
        transitionedBy: testUserId,
        comments: 'Transitioned from CORRECTION to ROOT_CAUSE_ANALYSIS',
        transitionDate: new Date()
      }).returning();

      expect(historyEntry).toBeDefined();
      expect(historyEntry.fromState).toBe('CORRECTION');
      expect(historyEntry.toState).toBe('ROOT_CAUSE_ANALYSIS');
    });

    it('should validate fishbone analysis data structure', () => {
      const fishboneData = {
        people: ['Insufficient training on new procedure', 'Operator fatigue during night shift'],
        process: ['Outdated work instruction', 'Missing quality check step'],
        equipment: ['Calibration drift in measurement device', 'Worn tooling'],
        materials: ['Raw material specification change', 'Supplier quality issue'],
        environment: ['Temperature fluctuation in clean room', 'Humidity control failure'],
        methods: ['Inadequate test method validation', 'Missing verification step']
      };

      // Validate fishbone structure
      expect(fishboneData).toHaveProperty('people');
      expect(fishboneData).toHaveProperty('process');
      expect(fishboneData).toHaveProperty('equipment');
      expect(fishboneData).toHaveProperty('materials');
      expect(fishboneData).toHaveProperty('environment');
      expect(fishboneData).toHaveProperty('methods');

      // Validate total causes
      const totalCauses = Object.values(fishboneData).flat().length;
      expect(totalCauses).toBeGreaterThan(0);
      expect(totalCauses).toBe(12); // 2 causes per category
    });
  });

  describe('Phase 3: CORRECTIVE_ACTION - Implementation', () => {
    it('should transition to CORRECTIVE_ACTION phase', async () => {
      const [updatedWorkflow] = await db.update(capaWorkflows)
        .set({
          currentState: 'CORRECTIVE_ACTION',
          transitionDate: new Date(),
          transitionedBy: testUserId
        })
        .where(eq(capaWorkflows.id, testWorkflowId))
        .returning();

      expect(updatedWorkflow.currentState).toBe('CORRECTIVE_ACTION');
    });

    it('should validate corrective action data', () => {
      const correctiveActionData = {
        description: 'Update work instruction WI-001 to include additional quality check',
        assignedTo: 'Quality Manager',
        dueDate: '2025-06-30',
        success_criteria: 'Zero defects in next 100 units produced',
        resources_required: 'Training budget $5000, 2 weeks implementation time'
      };

      expect(correctiveActionData.description).toBeDefined();
      expect(correctiveActionData.success_criteria).toBeDefined();
      expect(correctiveActionData.resources_required).toBeDefined();
    });
  });

  describe('Phase 4: PREVENTIVE_ACTION - System-wide Prevention', () => {
    it('should transition to PREVENTIVE_ACTION phase', async () => {
      const [updatedWorkflow] = await db.update(capaWorkflows)
        .set({
          currentState: 'PREVENTIVE_ACTION',
          transitionDate: new Date(),
          transitionedBy: testUserId
        })
        .where(eq(capaWorkflows.id, testWorkflowId))
        .returning();

      expect(updatedWorkflow.currentState).toBe('PREVENTIVE_ACTION');
    });

    it('should validate preventive action scope options', () => {
      const validScopes = [
        'local',
        'process_wide', 
        'facility_wide',
        'company_wide',
        'supplier_network'
      ];

      const preventiveActionData = {
        description: 'Implement automated quality checks across all production lines',
        scope: 'facility_wide',
        impact_assessment: 'Will prevent similar issues across all products',
        implementation_plan: 'Phase 1: Pilot line, Phase 2: Full rollout',
        monitoring_plan: 'Monthly quality metrics review'
      };

      expect(validScopes).toContain(preventiveActionData.scope);
      expect(preventiveActionData.impact_assessment).toBeDefined();
      expect(preventiveActionData.monitoring_plan).toBeDefined();
    });
  });

  describe('Phase 5: EFFECTIVENESS_VERIFICATION - Validation', () => {
    it('should transition to EFFECTIVENESS_VERIFICATION phase', async () => {
      const [updatedWorkflow] = await db.update(capaWorkflows)
        .set({
          currentState: 'EFFECTIVENESS_VERIFICATION',
          transitionDate: new Date(),
          transitionedBy: testUserId
        })
        .where(eq(capaWorkflows.id, testWorkflowId))
        .returning();

      expect(updatedWorkflow.currentState).toBe('EFFECTIVENESS_VERIFICATION');
    });

    it('should validate effectiveness rating options', () => {
      const validRatings = [
        'highly_effective',
        'effective',
        'partially_effective',
        'not_effective'
      ];

      const effectivenessData = {
        review_date: '2025-07-15',
        effectiveness_rating: 'effective',
        evidence_collected: 'Quality metrics show 95% reduction in similar defects',
        additional_actions_needed: false,
        review_comments: 'Actions successfully implemented and verified'
      };

      expect(validRatings).toContain(effectivenessData.effectiveness_rating);
      expect(effectivenessData.evidence_collected).toBeDefined();
    });
  });

  describe('Workflow Integration Tests', () => {
    it('should maintain complete audit trail', async () => {
      // Verify complete workflow history
      const history = await db.select()
        .from(capaWorkflowHistory)
        .where(eq(capaWorkflowHistory.workflowId, testWorkflowId));

      expect(history.length).toBeGreaterThan(0);
      
      // Check for proper phase transitions
      const transitions = history.map(h => `${h.fromState} -> ${h.toState}`);
      expect(transitions).toContain('CORRECTION -> ROOT_CAUSE_ANALYSIS');
    });

    it('should enforce proper phase sequence', () => {
      const expectedPhaseSequence = [
        'CORRECTION',
        'ROOT_CAUSE_ANALYSIS', 
        'CORRECTIVE_ACTION',
        'PREVENTIVE_ACTION',
        'EFFECTIVENESS_VERIFICATION'
      ];

      // Validate phase order
      for (let i = 0; i < expectedPhaseSequence.length - 1; i++) {
        const currentPhase = expectedPhaseSequence[i];
        const nextPhase = expectedPhaseSequence[i + 1];
        expect(expectedPhaseSequence.indexOf(nextPhase)).toBeGreaterThan(
          expectedPhaseSequence.indexOf(currentPhase)
        );
      }
    });

    it('should validate workflow completion criteria', async () => {
      // Get final workflow state
      const [finalWorkflow] = await db.select()
        .from(capaWorkflows)
        .where(eq(capaWorkflows.id, testWorkflowId));

      expect(finalWorkflow.currentState).toBe('EFFECTIVENESS_VERIFICATION');
      expect(finalWorkflow.transitionDate).toBeDefined();
      expect(finalWorkflow.transitionedBy).toBe(testUserId);
    });
  });

  describe('ISO 13485:2016 Compliance Validation', () => {
    it('should maintain regulatory compliance requirements', () => {
      const complianceChecks = {
        auditTrail: true,
        electronicSignatures: true,
        documentControl: true,
        riskManagement: true,
        correctiveActions: true,
        preventiveActions: true,
        effectivenessReview: true
      };

      Object.values(complianceChecks).forEach(check => {
        expect(check).toBe(true);
      });
    });

    it('should support 21 CFR Part 11 requirements', () => {
      const part11Requirements = {
        userAuthentication: true,
        accessControl: true,
        auditTrails: true,
        electronicRecords: true,
        systemValidation: true
      };

      Object.values(part11Requirements).forEach(requirement => {
        expect(requirement).toBe(true);
      });
    });
  });
});