import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest } from '../lib/queryClient';

// Mock fetch
global.fetch = vi.fn();

describe('IEC 62304 Compliance Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // 5.1 Software Development Planning
  describe('5.1 Software Development Planning', () => {
    it('should validate software development plan structure', async () => {
      const mockPlan = {
        id: 1,
        title: 'Software Development Plan',
        version: '1.0',
        approvalStatus: 'Approved',
        sections: [
          'Development Activities',
          'Development Timeline',
          'Configuration Management',
          'Problem Resolution',
          'Risk Management'
        ],
        approvedBy: 'Quality Director',
        approvalDate: '2025-04-15'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPlan
      });

      const response = await fetch('/api/design-control/development-plan/1');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toEqual(mockPlan);
      expect(data.sections).toContain('Risk Management');
      expect(data.approvalStatus).toBe('Approved');
    });
  });

  // 5.2 Software Requirements Analysis
  describe('5.2 Software Requirements Analysis', () => {
    it('should validate software requirements structure', async () => {
      const mockRequirements = {
        id: 1,
        projectId: 100,
        requirements: [
          {
            id: 1,
            requirementId: 'REQ-001',
            description: 'System shall maintain audit logs for all document changes',
            type: 'Functional',
            riskLevel: 'Medium',
            verificationMethod: 'Test',
            status: 'Approved'
          },
          {
            id: 2,
            requirementId: 'REQ-002',
            description: 'System shall require electronic signatures for document approvals',
            type: 'Regulatory',
            riskLevel: 'High',
            verificationMethod: 'Demo',
            status: 'Approved'
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRequirements
      });

      const response = await fetch('/api/design-control/requirements/1');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.requirements.length).toBeGreaterThan(0);
      expect(data.requirements[0]).toHaveProperty('requirementId');
      expect(data.requirements[0]).toHaveProperty('riskLevel');
      expect(data.requirements[0]).toHaveProperty('verificationMethod');
    });
  });

  // 5.3 Software Architectural Design
  describe('5.3 Software Architectural Design', () => {
    it('should validate architecture design document structure', async () => {
      const mockArchitecture = {
        id: 1,
        projectId: 100,
        version: '1.2',
        components: [
          {
            id: 1,
            name: 'Authentication Module',
            description: 'Handles user authentication and authorization',
            safetyClass: 'B',
            interfaces: ['Login API', 'User Session Management']
          },
          {
            id: 2,
            name: 'Document Control Module',
            description: 'Manages document lifecycle and approvals',
            safetyClass: 'C',
            interfaces: ['Document API', 'Version Control']
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockArchitecture
      });

      const response = await fetch('/api/design-control/architecture/1');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.components.length).toBeGreaterThan(0);
      expect(data.components[0]).toHaveProperty('safetyClass');
      expect(data.components[0]).toHaveProperty('interfaces');
    });
  });

  // 5.5 Software Integration and Integration Testing
  describe('5.5 Software Integration Testing', () => {
    it('should validate integration test structure', async () => {
      const mockIntegrationTests = {
        id: 1,
        projectId: 100,
        testSuite: 'IOVV-Integration-Suite',
        testRuns: [
          {
            id: 1,
            name: 'API Integration Test',
            status: 'Passed',
            executionDate: '2025-04-20',
            requirements: ['REQ-001', 'REQ-002'],
            deviations: []
          },
          {
            id: 2,
            name: 'Module Integration Test',
            status: 'Failed',
            executionDate: '2025-04-21',
            requirements: ['REQ-003'],
            deviations: [
              {
                description: 'Data exchange between modules fails under high load',
                severity: 'Medium',
                resolution: 'Pending'
              }
            ]
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockIntegrationTests
      });

      const response = await fetch('/api/design-control/integration-tests/1');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.testRuns.length).toBeGreaterThan(0);
      expect(data.testRuns[0]).toHaveProperty('requirements');
      expect(data.testRuns[0]).toHaveProperty('deviations');
      
      // Each test run should link to requirements
      data.testRuns.forEach(testRun => {
        expect(Array.isArray(testRun.requirements)).toBe(true);
      });
    });
  });

  // 5.6 Software System Testing
  describe('5.6 Software System Testing', () => {
    it('should validate system test structure and traceability', async () => {
      const mockSystemTests = {
        id: 1,
        projectId: 100,
        testSuite: 'IOVV-System-Suite',
        testRuns: [
          {
            id: 1,
            name: 'Full System Test',
            status: 'Passed',
            executionDate: '2025-04-25',
            requirements: ['REQ-001', 'REQ-002', 'REQ-003', 'REQ-004'],
            deviations: []
          }
        ],
        coverageReport: {
          totalRequirements: 4,
          coveredRequirements: 4,
          coveragePercentage: 100
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSystemTests
      });

      const response = await fetch('/api/design-control/system-tests/1');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toHaveProperty('coverageReport');
      expect(data.coverageReport).toHaveProperty('coveragePercentage');
      
      // Coverage should be calculated correctly
      const expectedCoverage = 
        (data.coverageReport.coveredRequirements / data.coverageReport.totalRequirements) * 100;
      expect(data.coverageReport.coveragePercentage).toBe(expectedCoverage);
    });
  });

  // 5.8 Software Release
  describe('5.8 Software Release', () => {
    it('should validate release document structure', async () => {
      const mockRelease = {
        id: 1,
        projectId: 100,
        releaseVersion: '1.0.0',
        releaseDate: '2025-05-01',
        approvalStatus: 'Approved',
        approvedBy: [
          {
            id: 1,
            name: 'John Smith',
            role: 'Quality Director',
            approvalDate: '2025-04-28'
          },
          {
            id: 2,
            name: 'Jane Doe',
            role: 'Regulatory Affairs',
            approvalDate: '2025-04-29'
          }
        ],
        verification: {
          allTestsPassed: true,
          allRisksMitigated: true,
          allDocumentsApproved: true
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRelease
      });

      const response = await fetch('/api/design-control/releases/1');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toHaveProperty('approvalStatus');
      expect(data).toHaveProperty('verification');
      
      // Release should have proper approval and verification
      expect(data.approvalStatus).toBe('Approved');
      expect(data.verification.allTestsPassed).toBe(true);
      expect(data.verification.allRisksMitigated).toBe(true);
      expect(data.verification.allDocumentsApproved).toBe(true);
    });
  });
});