import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Capa, CapaStatus, CapaPriority } from '@shared/schema';

describe('CAPA Workflow Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CAPA State Transitions', () => {
    it('should transition from open to investigation', () => {
      const capa = testUtils.createMockCapa({ status: 'open' });
      
      const result = transitionCapaStatus(capa, 'investigation');
      
      expect(result.status).toBe('investigation');
      expect(result).toHaveValidAuditTrail();
    });

    it('should transition from investigation to action_plan', () => {
      const capa = testUtils.createMockCapa({ status: 'investigation' });
      
      const result = transitionCapaStatus(capa, 'action_plan');
      
      expect(result.status).toBe('action_plan');
      expect(result.auditTrail).toContainEqual(
        expect.objectContaining({
          action: 'status_change',
          from: 'investigation',
          to: 'action_plan'
        })
      );
    });

    it('should reject invalid state transitions', () => {
      const capa = testUtils.createMockCapa({ status: 'open' });
      
      expect(() => transitionCapaStatus(capa, 'closed')).toThrow(
        'Invalid transition from open to closed'
      );
    });

    it('should allow emergency closure with proper authorization', () => {
      const capa = testUtils.createMockCapa({ status: 'investigation' });
      const adminUser = testUtils.createMockUser({ role: 'admin' });
      
      const result = emergencyCloseCapaWithJustification(
        capa, 
        adminUser, 
        'Emergency closure due to safety concern'
      );
      
      expect(result.status).toBe('closed');
      expect(result.closureReason).toBe('Emergency closure due to safety concern');
      expect(result).toHaveValidAuditTrail();
    });
  });

  describe('CAPA Priority Management', () => {
    const priorityTestCases = [
      { riskLevel: 'high', expectedPriority: 'critical', daysToAssign: 1 },
      { riskLevel: 'medium', expectedPriority: 'high', daysToAssign: 3 },
      { riskLevel: 'low', expectedPriority: 'medium', daysToAssign: 7 }
    ];

    priorityTestCases.forEach(({ riskLevel, expectedPriority, daysToAssign }) => {
      it(`should assign ${expectedPriority} priority for ${riskLevel} risk`, () => {
        const capa = createCapaWithRiskAssessment(riskLevel);
        
        expect(capa.priority).toBe(expectedPriority);
        expect(capa.dueDate).toBeDefined();
        
        const dueDate = new Date(capa.dueDate);
        const assignedDate = new Date(capa.createdAt);
        const daysDiff = Math.ceil((dueDate.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        expect(daysDiff).toBeLessThanOrEqual(daysToAssign);
      });
    });

    it('should escalate overdue CAPAs automatically', () => {
      const overdueCapa = testUtils.createMockCapa({
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        status: 'action_plan'
      });
      
      const escalated = escalateOverdueCapa(overdueCapa);
      
      expect(escalated.isEscalated).toBe(true);
      expect(escalated.escalationLevel).toBe(1);
      expect(escalated.notifications).toContainEqual(
        expect.objectContaining({
          type: 'escalation',
          recipient: 'manager'
        })
      );
    });
  });

  describe('Root Cause Analysis Validation', () => {
    it('should validate complete root cause analysis', () => {
      const rootCauseAnalysis = {
        method: '5-why',
        findings: [
          'Why 1: Process deviation occurred',
          'Why 2: Training was insufficient',
          'Why 3: Training program outdated',
          'Why 4: Review cycle too long',
          'Why 5: Resource allocation inadequate'
        ],
        conclusion: 'Root cause: Inadequate resource allocation for training program updates',
        evidence: ['training_records.pdf', 'process_audit.pdf']
      };
      
      const isValid = validateRootCauseAnalysis(rootCauseAnalysis);
      
      expect(isValid).toBe(true);
    });

    it('should reject incomplete root cause analysis', () => {
      const incompleteAnalysis = {
        method: '5-why',
        findings: ['Why 1: Something went wrong'],
        conclusion: '',
        evidence: []
      };
      
      const isValid = validateRootCauseAnalysis(incompleteAnalysis);
      
      expect(isValid).toBe(false);
    });

    it('should validate fishbone diagram analysis', () => {
      const fishboneAnalysis = {
        method: 'fishbone',
        categories: {
          people: ['Insufficient training', 'Unclear responsibilities'],
          process: ['Outdated procedure', 'Missing verification step'],
          equipment: ['Calibration overdue', 'Software bug'],
          environment: ['Temperature fluctuation', 'Humidity control'],
          materials: ['Supplier quality issue', 'Storage conditions'],
          measurement: ['Gauge R&R study needed', 'Measurement uncertainty']
        },
        conclusion: 'Multiple contributing factors identified across all categories',
        evidence: ['fishbone_diagram.pdf', 'investigation_report.pdf']
      };
      
      const isValid = validateRootCauseAnalysis(fishboneAnalysis);
      
      expect(isValid).toBe(true);
    });
  });

  describe('Effectiveness Review Process', () => {
    it('should schedule effectiveness review after implementation', () => {
      const implementedCapa = testUtils.createMockCapa({
        status: 'implemented',
        implementationDate: new Date().toISOString()
      });
      
      const review = scheduleEffectivenessReview(implementedCapa);
      
      expect(review.scheduledDate).toBeDefined();
      expect(review.reviewType).toBe('effectiveness');
      expect(review.criteria).toContain('objective_evidence');
      expect(review.criteria).toContain('performance_metrics');
    });

    it('should validate effectiveness review completion', () => {
      const effectivenessReview = {
        objectiveEvidence: ['audit_results.pdf', 'performance_data.xlsx'],
        performanceMetrics: {
          defectRate: { before: 5.2, after: 1.1, target: 2.0 },
          customerComplaints: { before: 12, after: 3, target: 5 }
        },
        conclusion: 'Actions proven effective',
        reviewer: 'quality_manager',
        reviewDate: new Date().toISOString()
      };
      
      const isEffective = validateEffectivenessReview(effectivenessReview);
      
      expect(isEffective).toBe(true);
    });

    it('should identify ineffective actions requiring additional measures', () => {
      const ineffectiveReview = {
        objectiveEvidence: ['audit_results.pdf'],
        performanceMetrics: {
          defectRate: { before: 5.2, after: 4.8, target: 2.0 }
        },
        conclusion: 'Actions partially effective, additional measures required',
        reviewer: 'quality_manager',
        reviewDate: new Date().toISOString()
      };
      
      const isEffective = validateEffectivenessReview(ineffectiveReview);
      
      expect(isEffective).toBe(false);
    });
  });

  describe('FDA 21 CFR Part 11 Compliance', () => {
    it('should maintain electronic signature for all critical actions', () => {
      const capa = testUtils.createMockCapa();
      const user = testUtils.createMockUser();
      
      const signedAction = addElectronicSignature(capa, user, 'approval', 'Approved for implementation');
      
      expect(signedAction).toBeCompliantWithFDA21CFRPart11();
      expect(signedAction.electronicSignature).toMatchObject({
        userId: user.id,
        action: 'approval',
        reason: 'Approved for implementation',
        timestamp: expect.any(String),
        hash: expect.any(String)
      });
    });

    it('should prevent unauthorized modifications to signed records', () => {
      const signedCapa = testUtils.createMockCapa({
        electronicSignature: {
          userId: 1,
          action: 'approval',
          reason: 'Approved',
          timestamp: new Date().toISOString(),
          hash: 'abc123'
        }
      });
      
      expect(() => {
        modifySignedRecord(signedCapa, { title: 'Modified title' });
      }).toThrow('Cannot modify signed record without new signature');
    });
  });
});

// Mock functions for CAPA workflow testing
function transitionCapaStatus(capa: any, newStatus: CapaStatus): any {
  const validTransitions = {
    open: ['investigation', 'cancelled'],
    investigation: ['action_plan', 'cancelled'],
    action_plan: ['implementation', 'cancelled'],
    implementation: ['verification', 'cancelled'],
    verification: ['closed', 'action_plan'],
    closed: [],
    cancelled: []
  };

  if (!validTransitions[capa.status]?.includes(newStatus)) {
    throw new Error(`Invalid transition from ${capa.status} to ${newStatus}`);
  }

  return {
    ...capa,
    status: newStatus,
    auditTrail: [
      ...(capa.auditTrail || []),
      {
        action: 'status_change',
        from: capa.status,
        to: newStatus,
        userId: 1,
        timestamp: new Date().toISOString()
      }
    ]
  };
}

function emergencyCloseCapaWithJustification(capa: any, user: any, reason: string): any {
  if (user.role !== 'admin') {
    throw new Error('Only administrators can perform emergency closure');
  }

  return {
    ...capa,
    status: 'closed',
    closureReason: reason,
    emergencyClosure: true,
    auditTrail: [
      ...(capa.auditTrail || []),
      {
        action: 'emergency_closure',
        userId: user.id,
        reason,
        timestamp: new Date().toISOString()
      }
    ]
  };
}

function createCapaWithRiskAssessment(riskLevel: string): any {
  const priorityMap = {
    high: { priority: 'critical', days: 1 },
    medium: { priority: 'high', days: 3 },
    low: { priority: 'medium', days: 7 }
  };

  const config = priorityMap[riskLevel];
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + config.days);

  return {
    ...testUtils.createMockCapa(),
    riskLevel,
    priority: config.priority,
    dueDate: dueDate.toISOString()
  };
}

function escalateOverdueCapa(capa: any): any {
  return {
    ...capa,
    isEscalated: true,
    escalationLevel: 1,
    notifications: [{
      type: 'escalation',
      recipient: 'manager',
      message: `CAPA ${capa.id} is overdue and requires immediate attention`,
      timestamp: new Date().toISOString()
    }]
  };
}

function validateRootCauseAnalysis(analysis: any): boolean {
  if (!analysis.method || !analysis.conclusion) return false;
  
  if (analysis.method === '5-why') {
    return analysis.findings?.length >= 3 && analysis.evidence?.length > 0;
  }
  
  if (analysis.method === 'fishbone') {
    const requiredCategories = ['people', 'process', 'equipment', 'environment'];
    return requiredCategories.every(cat => 
      analysis.categories?.[cat]?.length > 0
    ) && analysis.evidence?.length > 0;
  }
  
  return false;
}

function scheduleEffectivenessReview(capa: any): any {
  const reviewDate = new Date();
  reviewDate.setDate(reviewDate.getDate() + 30); // 30 days after implementation

  return {
    capaId: capa.id,
    scheduledDate: reviewDate.toISOString(),
    reviewType: 'effectiveness',
    criteria: ['objective_evidence', 'performance_metrics', 'trend_analysis'],
    status: 'scheduled'
  };
}

function validateEffectivenessReview(review: any): boolean {
  if (!review.objectiveEvidence?.length || !review.performanceMetrics) {
    return false;
  }

  // Check if metrics meet targets
  for (const metric of Object.values(review.performanceMetrics)) {
    if (typeof metric === 'object' && metric.after > metric.target) {
      return false;
    }
  }

  return true;
}

function addElectronicSignature(capa: any, user: any, action: string, reason: string): any {
  const timestamp = new Date().toISOString();
  const hash = generateSignatureHash(capa, user, action, timestamp);

  return {
    ...capa,
    electronicSignature: {
      userId: user.id,
      action,
      reason,
      timestamp,
      hash
    },
    auditTrail: [
      ...(capa.auditTrail || []),
      {
        action: 'electronic_signature',
        userId: user.id,
        timestamp,
        details: { action, reason }
      }
    ],
    dataIntegrity: true
  };
}

function modifySignedRecord(capa: any, modifications: any): any {
  if (capa.electronicSignature) {
    throw new Error('Cannot modify signed record without new signature');
  }
  return { ...capa, ...modifications };
}

function generateSignatureHash(capa: any, user: any, action: string, timestamp: string): string {
  // Simplified hash generation for testing
  return `${capa.id}-${user.id}-${action}-${timestamp}`.split('').reduce((hash, char) => {
    return ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff;
  }, 0).toString(16);
}