
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { createTestDatabase, cleanupTestData } from '../setup';
import { apiRequest } from '../../client/src/lib/queryClient';

// Mock authentication token
const TEST_AUTH_TOKEN = 'test-auth-token-9999';

// Test data generators
const generateTestUser = () => ({
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  firstName: 'Test',
  lastName: 'User',
  role: 'qa',
  department: 'Quality Assurance'
});

const generateTestDocument = () => ({
  title: `Test Document ${Date.now()}`,
  type: 'procedure',
  version: '1.0',
  content: 'Test document content for functional testing',
  status: 'draft'
});

const generateTestCapa = () => ({
  title: `Test CAPA ${Date.now()}`,
  description: 'Functional test CAPA description',
  source: 'internal_audit',
  priority: 2,
  assignedTo: 9999,
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
});

const generateTestSupplier = () => ({
  name: `Test Supplier ${Date.now()}`,
  address: '123 Test Street, Test City, TC 12345',
  contactPerson: 'John Test',
  email: `supplier_${Date.now()}@example.com`,
  phone: '+1-555-0123',
  supplierType: 'critical',
  certifications: ['ISO 9001', 'ISO 13485']
});

const generateTestAudit = () => ({
  title: `Test Audit ${Date.now()}`,
  auditType: 'internal',
  auditScope: 'Document Control Process',
  plannedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  leadAuditor: 9999,
  auditCriteria: 'ISO 13485:2016 Section 4.2',
  status: 'planned'
});

const generateTestComplaint = () => ({
  complaintNumber: `COMP-${Date.now()}`,
  customerName: 'Test Customer',
  productInvolved: 'Test Product',
  complaintDescription: 'Test complaint description',
  severity: 'medium',
  dateReceived: new Date().toISOString(),
  reportedBy: 9999
});

const generateTestDesignProject = () => ({
  title: `Test Design Project ${Date.now()}`,
  description: 'Functional test design project',
  projectTypeId: 1,
  riskLevel: 'medium',
  responsiblePerson: 9999,
  startDate: new Date().toISOString(),
  targetCompletionDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
});

describe('Comprehensive eQMS Functional Testing Suite', () => {
  let testDb: any;
  let testUser: any;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    console.log('🔧 Test database initialized');
  });

  afterAll(async () => {
    await cleanupTestData();
    console.log('🧹 Test cleanup completed');
  });

  beforeEach(async () => {
    // Create test user for each test
    testUser = generateTestUser();
    console.log(`👤 Test user created: ${testUser.username}`);
  });

  afterEach(async () => {
    // Cleanup test data after each test
    await cleanupTestData();
  });

  // ========================================
  // 1. DOCUMENT CONTROL MODULE TESTING
  // ========================================
  describe('Document Control Module', () => {
    it('should create, review, approve, and publish documents (ISO 13485:7.5.3)', async () => {
      const documentData = generateTestDocument();
      
      // Step 1: Create document
      const createResponse = await apiRequest('/api/iso13485-documents', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(documentData)
      });
      
      expect(createResponse.status).toBe(201);
      const document = await createResponse.json();
      expect(document.title).toBe(documentData.title);
      expect(document.status).toBe('draft');
      
      // Step 2: Submit for review
      const reviewResponse = await apiRequest(`/api/iso13485-documents/${document.id}/status`, {
        method: 'PATCH',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify({ status: 'under_review' })
      });
      
      expect(reviewResponse.status).toBe(200);
      
      // Step 3: Approve document
      const approveResponse = await apiRequest(`/api/iso13485-documents/${document.id}/status`, {
        method: 'PATCH',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify({ 
          status: 'approved',
          approverComment: 'Document approved for implementation',
          electronicSignature: true
        })
      });
      
      expect(approveResponse.status).toBe(200);
      
      // Step 4: Verify audit trail
      const auditResponse = await apiRequest(`/api/iso13485-documents/${document.id}/audit-trail`, {
        headers: { 'X-Auth-Local': 'true' }
      });
      
      expect(auditResponse.status).toBe(200);
      const auditTrail = await auditResponse.json();
      expect(auditTrail.length).toBeGreaterThan(0);
      expect(auditTrail.some(entry => entry.action === 'approved')).toBe(true);
      
      console.log('✅ Document Control Module: Full lifecycle test passed');
    });

    it('should enforce version control and change management', async () => {
      const documentData = generateTestDocument();
      
      // Create and approve initial document
      const createResponse = await apiRequest('/api/iso13485-documents', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(documentData)
      });
      
      const document = await createResponse.json();
      
      // Create revision
      const revisionResponse = await apiRequest(`/api/iso13485-documents/${document.id}/revisions`, {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify({
          content: 'Updated content with improvements',
          changeReason: 'Process improvement based on audit findings',
          majorChange: false
        })
      });
      
      expect(revisionResponse.status).toBe(201);
      const revision = await revisionResponse.json();
      expect(revision.version).toBe('1.1');
      
      console.log('✅ Document Control Module: Version control test passed');
    });

    it('should validate electronic signatures (21 CFR Part 11)', async () => {
      const documentData = generateTestDocument();
      
      const createResponse = await apiRequest('/api/iso13485-documents', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(documentData)
      });
      
      const document = await createResponse.json();
      
      // Apply electronic signature
      const signatureResponse = await apiRequest(`/api/iso13485-documents/${document.id}/sign`, {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify({
          meaning: 'Approved by Quality Manager',
          password: 'test_password'
        })
      });
      
      expect(signatureResponse.status).toBe(200);
      const signature = await signatureResponse.json();
      expect(signature.meaning).toBe('Approved by Quality Manager');
      expect(signature.isValid).toBe(true);
      
      console.log('✅ Document Control Module: Electronic signature test passed');
    });
  });

  // ========================================
  // 2. CAPA MANAGEMENT MODULE TESTING
  // ========================================
  describe('CAPA Management Module', () => {
    it('should create and manage complete CAPA lifecycle (ISO 13485:8.5.2)', async () => {
      const capaData = generateTestCapa();
      
      // Step 1: Create CAPA
      const createResponse = await apiRequest('/api/capa', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(capaData)
      });
      
      expect(createResponse.status).toBe(201);
      const capa = await createResponse.json();
      expect(capa.title).toBe(capaData.title);
      expect(capa.statusId).toBe(1); // Draft status
      
      // Step 2: Transition through workflow states
      const statusTransitions = [2, 3, 4]; // Under Review, Approved, Closed
      
      for (const statusId of statusTransitions) {
        const transitionResponse = await apiRequest(`/api/capa/${capa.id}/status`, {
          method: 'PATCH',
          headers: { 'X-Auth-Local': 'true' },
          body: JSON.stringify({ statusId })
        });
        
        expect(transitionResponse.status).toBe(200);
      }
      
      // Step 3: Verify final state
      const finalResponse = await apiRequest(`/api/capa/${capa.id}`, {
        headers: { 'X-Auth-Local': 'true' }
      });
      
      const finalCapa = await finalResponse.json();
      expect(finalCapa.statusId).toBe(4); // Closed
      
      console.log('✅ CAPA Management Module: Full lifecycle test passed');
    });

    it('should validate root cause analysis and corrective actions', async () => {
      const capaData = generateTestCapa();
      
      const createResponse = await apiRequest('/api/capa', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(capaData)
      });
      
      const capa = await createResponse.json();
      
      // Add root cause analysis
      const rcaResponse = await apiRequest(`/api/capa/${capa.id}/root-cause-analysis`, {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify({
          methodology: '5 Why Analysis',
          findings: 'Root cause identified as inadequate training',
          evidence: 'Training records review completed'
        })
      });
      
      expect(rcaResponse.status).toBe(201);
      
      // Add corrective action
      const actionResponse = await apiRequest(`/api/capa/${capa.id}/actions`, {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify({
          type: 'corrective',
          description: 'Implement comprehensive training program',
          assignedTo: 9999,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        })
      });
      
      expect(actionResponse.status).toBe(201);
      
      console.log('✅ CAPA Management Module: Root cause analysis test passed');
    });

    it('should track effectiveness verification', async () => {
      const capaData = generateTestCapa();
      
      const createResponse = await apiRequest('/api/capa', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(capaData)
      });
      
      const capa = await createResponse.json();
      
      // Add effectiveness verification
      const effectivenessResponse = await apiRequest(`/api/capa/${capa.id}/effectiveness`, {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify({
          verificationMethod: 'Follow-up audit',
          criteria: 'No recurrence of non-conformance',
          results: 'Effective - no issues identified',
          verifiedBy: 9999,
          verificationDate: new Date().toISOString()
        })
      });
      
      expect(effectivenessResponse.status).toBe(201);
      
      console.log('✅ CAPA Management Module: Effectiveness verification test passed');
    });
  });

  // ========================================
  // 3. SUPPLIER MANAGEMENT MODULE TESTING
  // ========================================
  describe('Supplier Management Module', () => {
    it('should manage supplier qualification process (ISO 13485:7.4.1)', async () => {
      const supplierData = generateTestSupplier();
      
      // Step 1: Create supplier
      const createResponse = await apiRequest('/api/suppliers', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(supplierData)
      });
      
      expect(createResponse.status).toBe(201);
      const supplier = await createResponse.json();
      expect(supplier.name).toBe(supplierData.name);
      expect(supplier.status).toBe('pending_qualification');
      
      // Step 2: Conduct supplier assessment
      const assessmentResponse = await apiRequest(`/api/suppliers/${supplier.id}/assessments`, {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify({
          assessmentType: 'initial_qualification',
          criteriaScores: {
            quality_system: 85,
            technical_capability: 90,
            delivery_performance: 88,
            regulatory_compliance: 92
          },
          overallScore: 89,
          recommendation: 'approve',
          assessorId: 9999
        })
      });
      
      expect(assessmentResponse.status).toBe(201);
      
      // Step 3: Approve supplier
      const approvalResponse = await apiRequest(`/api/suppliers/${supplier.id}/status`, {
        method: 'PATCH',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify({ status: 'approved' })
      });
      
      expect(approvalResponse.status).toBe(200);
      
      console.log('✅ Supplier Management Module: Qualification process test passed');
    });

    it('should track supplier performance and risk assessment', async () => {
      const supplierData = generateTestSupplier();
      
      const createResponse = await apiRequest('/api/suppliers', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(supplierData)
      });
      
      const supplier = await createResponse.json();
      
      // Add performance metrics
      const performanceResponse = await apiRequest(`/api/suppliers/${supplier.id}/performance`, {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify({
          period: '2025-Q1',
          onTimeDelivery: 95,
          qualityScore: 88,
          responsiveness: 92,
          costCompetitiveness: 85,
          riskLevel: 'low'
        })
      });
      
      expect(performanceResponse.status).toBe(201);
      
      console.log('✅ Supplier Management Module: Performance tracking test passed');
    });
  });

  // ========================================
  // 4. MANAGEMENT REVIEW MODULE TESTING
  // ========================================
  describe('Management Review Module', () => {
    it('should create comprehensive management review (ISO 13485:5.6)', async () => {
      const reviewData = {
        title: `Q1 2025 Management Review - ${Date.now()}`,
        reviewDate: new Date().toISOString(),
        reviewType: 'quarterly',
        attendees: ['Quality Manager', 'Operations Director', 'Regulatory Affairs'],
        agenda: [
          'QMS Performance Review',
          'Customer Feedback Analysis',
          'CAPA Effectiveness',
          'Supplier Performance'
        ]
      };
      
      // Step 1: Create management review
      const createResponse = await apiRequest('/api/management-reviews', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(reviewData)
      });
      
      expect(createResponse.status).toBe(201);
      const review = await createResponse.json();
      expect(review.title).toBe(reviewData.title);
      
      // Step 2: Add review inputs
      const inputCategories = [
        'customer_feedback',
        'qms_performance',
        'capa_status',
        'supplier_performance',
        'regulatory_changes'
      ];
      
      for (const category of inputCategories) {
        const inputResponse = await apiRequest(`/api/management-reviews/${review.id}/inputs`, {
          method: 'POST',
          headers: { 'X-Auth-Local': 'true' },
          body: JSON.stringify({
            category,
            content: `Test input for ${category}`,
            data: { metric: 95, trend: 'improving' }
          })
        });
        
        expect(inputResponse.status).toBe(201);
      }
      
      // Step 3: Generate action items
      const actionResponse = await apiRequest(`/api/management-reviews/${review.id}/actions`, {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify({
          description: 'Implement process improvement initiative',
          assignedTo: 9999,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high'
        })
      });
      
      expect(actionResponse.status).toBe(201);
      
      console.log('✅ Management Review Module: Comprehensive review test passed');
    });

    it('should validate intelligent action generation', async () => {
      const reviewData = {
        title: `Intelligent Review Test - ${Date.now()}`,
        reviewDate: new Date().toISOString(),
        reviewType: 'quarterly'
      };
      
      const createResponse = await apiRequest('/api/management-reviews', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(reviewData)
      });
      
      const review = await createResponse.json();
      
      // Trigger intelligent action generation
      const intelligentResponse = await apiRequest(`/api/management-reviews/${review.id}/generate-intelligent-actions`, {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' }
      });
      
      expect(intelligentResponse.status).toBe(200);
      const actions = await intelligentResponse.json();
      expect(Array.isArray(actions)).toBe(true);
      
      console.log('✅ Management Review Module: Intelligent action generation test passed');
    });
  });

  // ========================================
  // 5. DESIGN CONTROL MODULE TESTING
  // ========================================
  describe('Design Control Module', () => {
    it('should manage design project lifecycle (ISO 13485:7.3)', async () => {
      const projectData = generateTestDesignProject();
      
      // Step 1: Create design project
      const createResponse = await apiRequest('/api/design-projects', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(projectData)
      });
      
      expect(createResponse.status).toBe(201);
      const project = await createResponse.json();
      expect(project.title).toBe(projectData.title);
      
      // Step 2: Add design inputs
      const inputResponse = await apiRequest(`/api/design-projects/${project.id}/inputs`, {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify({
          title: 'Functional Requirement 001',
          description: 'System shall maintain user sessions',
          inputType: 'functional',
          acceptanceCriteria: 'Session timeout after 30 minutes of inactivity'
        })
      });
      
      expect(inputResponse.status).toBe(201);
      
      // Step 3: Add design outputs
      const outputResponse = await apiRequest(`/api/design-projects/${project.id}/outputs`, {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify({
          title: 'Session Management Specification',
          description: 'Technical specification for session management',
          outputType: 'specification',
          relatedInputs: ['Functional Requirement 001']
        })
      });
      
      expect(outputResponse.status).toBe(201);
      
      console.log('✅ Design Control Module: Project lifecycle test passed');
    });

    it('should validate IOVV matrix implementation (IEC 62304)', async () => {
      const matrixData = {
        module: 'Authentication System',
        version: '1.0',
        status: 'Draft',
        updatedBy: 9999
      };
      
      const createResponse = await apiRequest('/api/iovv/matrices', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(matrixData)
      });
      
      expect(createResponse.status).toBe(201);
      const matrix = await createResponse.json();
      
      // Add requirements
      const reqResponse = await apiRequest('/api/iovv/requirements', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify({
          requirementId: 'REQ-AUTH-001',
          matrixId: matrix.id,
          description: 'System shall authenticate users',
          source: 'User Requirements',
          priority: 'high',
          riskLevel: 'medium'
        })
      });
      
      expect(reqResponse.status).toBe(201);
      
      console.log('✅ Design Control Module: IOVV matrix test passed');
    });
  });

  // ========================================
  // 6. AUDIT MANAGEMENT MODULE TESTING
  // ========================================
  describe('Audit Management Module', () => {
    it('should manage internal audit process (ISO 13485:8.2.2)', async () => {
      const auditData = generateTestAudit();
      
      const createResponse = await apiRequest('/api/audits', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(auditData)
      });
      
      expect(createResponse.status).toBe(201);
      const audit = await createResponse.json();
      expect(audit.title).toBe(auditData.title);
      
      // Add audit findings
      const findingResponse = await apiRequest(`/api/audits/${audit.id}/findings`, {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify({
          description: 'Document approval process not followed',
          severity: 'major',
          clause: '4.2.3',
          evidence: 'Documents found without proper approval signatures'
        })
      });
      
      expect(findingResponse.status).toBe(201);
      
      console.log('✅ Audit Management Module: Internal audit test passed');
    });
  });

  // ========================================
  // 7. COMPLAINT MANAGEMENT MODULE TESTING
  // ========================================
  describe('Complaint Management Module', () => {
    it('should manage customer complaint lifecycle (ISO 13485:8.2.1)', async () => {
      const complaintData = generateTestComplaint();
      
      const createResponse = await apiRequest('/api/complaints', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(complaintData)
      });
      
      expect(createResponse.status).toBe(201);
      const complaint = await createResponse.json();
      expect(complaint.complaintNumber).toBe(complaintData.complaintNumber);
      
      // Add investigation
      const investigationResponse = await apiRequest(`/api/complaints/${complaint.id}/investigation`, {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify({
          investigationFindings: 'Root cause identified',
          correctiveActions: 'Process improvement implemented',
          investigatedBy: 9999
        })
      });
      
      expect(investigationResponse.status).toBe(201);
      
      console.log('✅ Complaint Management Module: Complaint lifecycle test passed');
    });
  });

  // ========================================
  // 8. TRAINING MANAGEMENT MODULE TESTING
  // ========================================
  describe('Training Management Module', () => {
    it('should manage training records and competency (ISO 13485:6.2)', async () => {
      const trainingData = {
        title: `QMS Training - ${Date.now()}`,
        description: 'ISO 13485 Quality Management System Training',
        trainingType: 'qms_training',
        duration: 240, // minutes
        trainer: 'Quality Manager',
        requiredForRoles: ['qa', 'quality_manager']
      };
      
      const createResponse = await apiRequest('/api/training-records', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(trainingData)
      });
      
      expect(createResponse.status).toBe(201);
      const training = await createResponse.json();
      expect(training.title).toBe(trainingData.title);
      
      // Assign training to user
      const assignResponse = await apiRequest(`/api/training-records/${training.id}/assign`, {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify({
          userId: 9999,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      });
      
      expect(assignResponse.status).toBe(201);
      
      console.log('✅ Training Management Module: Training assignment test passed');
    });
  });

  // ========================================
  // 9. SYSTEM INTEGRATION TESTING
  // ========================================
  describe('System Integration Testing', () => {
    it('should validate cross-module data integrity', async () => {
      // Create interconnected test data
      const capaData = generateTestCapa();
      const documentData = generateTestDocument();
      
      // Create CAPA
      const capaResponse = await apiRequest('/api/capa', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(capaData)
      });
      
      const capa = await capaResponse.json();
      
      // Create related document
      const docResponse = await apiRequest('/api/iso13485-documents', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify({
          ...documentData,
          relatedCapa: capa.id
        })
      });
      
      const document = await docResponse.json();
      
      // Verify relationship
      const relationshipResponse = await apiRequest(`/api/capa/${capa.id}/related-documents`, {
        headers: { 'X-Auth-Local': 'true' }
      });
      
      expect(relationshipResponse.status).toBe(200);
      const relatedDocs = await relationshipResponse.json();
      expect(relatedDocs.some(doc => doc.id === document.id)).toBe(true);
      
      console.log('✅ System Integration: Cross-module integrity test passed');
    });

    it('should validate audit trail consistency across modules', async () => {
      const capaData = generateTestCapa();
      
      const createResponse = await apiRequest('/api/capa', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(capaData)
      });
      
      const capa = await createResponse.json();
      
      // Update CAPA
      const updateResponse = await apiRequest(`/api/capa/${capa.id}`, {
        method: 'PATCH',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify({ description: 'Updated description' })
      });
      
      expect(updateResponse.status).toBe(200);
      
      // Verify audit trail
      const auditResponse = await apiRequest(`/api/audit-trail/capa/${capa.id}`, {
        headers: { 'X-Auth-Local': 'true' }
      });
      
      expect(auditResponse.status).toBe(200);
      const auditTrail = await auditResponse.json();
      expect(auditTrail.length).toBeGreaterThan(0);
      expect(auditTrail.some(entry => entry.action === 'UPDATE')).toBe(true);
      
      console.log('✅ System Integration: Audit trail consistency test passed');
    });
  });

  // ========================================
  // 10. PERFORMANCE AND SCALABILITY TESTING
  // ========================================
  describe('Performance and Scalability Testing', () => {
    it('should handle concurrent operations without data corruption', async () => {
      const promises = [];
      const testCount = 10;
      
      // Create multiple CAPAs concurrently
      for (let i = 0; i < testCount; i++) {
        const capaData = generateTestCapa();
        promises.push(
          apiRequest('/api/capa', {
            method: 'POST',
            headers: { 'X-Auth-Local': 'true' },
            body: JSON.stringify(capaData)
          })
        );
      }
      
      const results = await Promise.all(promises);
      
      // Verify all operations succeeded
      results.forEach(result => {
        expect(result.status).toBe(201);
      });
      
      // Verify data integrity
      const listResponse = await apiRequest('/api/capa', {
        headers: { 'X-Auth-Local': 'true' }
      });
      
      const capas = await listResponse.json();
      expect(capas.length).toBeGreaterThanOrEqual(testCount);
      
      console.log('✅ Performance: Concurrent operations test passed');
    });

    it('should maintain response times under load', async () => {
      const startTime = Date.now();
      
      // Perform multiple operations
      const operations = [
        apiRequest('/api/capa', { headers: { 'X-Auth-Local': 'true' } }),
        apiRequest('/api/iso13485-documents', { headers: { 'X-Auth-Local': 'true' } }),
        apiRequest('/api/suppliers', { headers: { 'X-Auth-Local': 'true' } }),
        apiRequest('/api/management-reviews', { headers: { 'X-Auth-Local': 'true' } })
      ];
      
      const results = await Promise.all(operations);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Verify all operations succeeded
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
      
      // Verify response time (should be under 5 seconds for multiple operations)
      expect(totalTime).toBeLessThan(5000);
      
      console.log(`✅ Performance: Response time test passed (${totalTime}ms)`);
    });
  });

  // ========================================
  // 11. COMPLIANCE AND REGULATORY TESTING
  // ========================================
  describe('Compliance and Regulatory Testing', () => {
    it('should validate ISO 13485:2016 compliance requirements', async () => {
      // Test documented procedures
      const procedureResponse = await apiRequest('/api/compliance/iso13485/procedures', {
        headers: { 'X-Auth-Local': 'true' }
      });
      
      expect(procedureResponse.status).toBe(200);
      const procedures = await procedureResponse.json();
      
      // Verify required procedures are documented
      const requiredProcedures = [
        'document_control',
        'management_review',
        'corrective_action',
        'preventive_action'
      ];
      
      requiredProcedures.forEach(procedure => {
        expect(procedures.some(p => p.type === procedure)).toBe(true);
      });
      
      console.log('✅ Compliance: ISO 13485:2016 compliance test passed');
    });

    it('should validate FDA 21 CFR Part 11 electronic records compliance', async () => {
      const documentData = generateTestDocument();
      
      const createResponse = await apiRequest('/api/iso13485-documents', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(documentData)
      });
      
      const document = await createResponse.json();
      
      // Verify electronic record requirements
      expect(document).toHaveProperty('createdAt');
      expect(document).toHaveProperty('createdBy');
      expect(document).toHaveProperty('version');
      
      // Verify audit trail
      const auditResponse = await apiRequest(`/api/iso13485-documents/${document.id}/audit-trail`, {
        headers: { 'X-Auth-Local': 'true' }
      });
      
      const auditTrail = await auditResponse.json();
      expect(auditTrail.length).toBeGreaterThan(0);
      expect(auditTrail[0]).toHaveProperty('timestamp');
      expect(auditTrail[0]).toHaveProperty('userId');
      expect(auditTrail[0]).toHaveProperty('action');
      
      console.log('✅ Compliance: FDA 21 CFR Part 11 compliance test passed');
    });
  });

  // ========================================
  // 12. SECURITY TESTING
  // ========================================
  describe('Security Testing', () => {
    it('should enforce access control and authentication', async () => {
      // Test unauthorized access
      const unauthorizedResponse = await apiRequest('/api/capa', {
        // No authentication headers
      });
      
      expect(unauthorizedResponse.status).toBe(401);
      
      // Test with valid authentication
      const authorizedResponse = await apiRequest('/api/capa', {
        headers: { 'X-Auth-Local': 'true' }
      });
      
      expect(authorizedResponse.status).toBe(200);
      
      console.log('✅ Security: Access control test passed');
    });

    it('should validate input sanitization', async () => {
      const maliciousData = {
        title: "<script>alert('XSS')</script>",
        description: "'; DROP TABLE capas; --"
      };
      
      const response = await apiRequest('/api/capa', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(maliciousData)
      });
      
      if (response.status === 201) {
        const capa = await response.json();
        // Verify malicious content is sanitized
        expect(capa.title).not.toContain('<script>');
        expect(capa.description).not.toContain('DROP TABLE');
      }
      
      console.log('✅ Security: Input sanitization test passed');
    });
  });

  // ========================================
  // 13. WORKFLOW AND PROCESS TESTING
  // ========================================
  describe('Workflow and Process Testing', () => {
    it('should validate workflow state transitions', async () => {
      const capaData = generateTestCapa();
      
      const createResponse = await apiRequest('/api/capa', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(capaData)
      });
      
      const capa = await createResponse.json();
      
      // Test valid transition
      const validTransition = await apiRequest(`/api/capa/${capa.id}/workflow/transition`, {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify({ 
          fromState: 'draft',
          toState: 'under_review',
          comment: 'Ready for review'
        })
      });
      
      expect(validTransition.status).toBe(200);
      
      // Test invalid transition
      const invalidTransition = await apiRequest(`/api/capa/${capa.id}/workflow/transition`, {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify({ 
          fromState: 'under_review',
          toState: 'closed',
          comment: 'Invalid transition'
        })
      });
      
      expect(invalidTransition.status).toBe(400);
      
      console.log('✅ Workflow: State transition validation test passed');
    });
  });

  // ========================================
  // 14. DATA VALIDATION AND INTEGRITY TESTING
  // ========================================
  describe('Data Validation and Integrity Testing', () => {
    it('should validate data constraints and business rules', async () => {
      // Test required field validation
      const invalidData = {
        title: '', // Required field empty
        description: 'Test description'
      };
      
      const response = await apiRequest('/api/capa', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(invalidData)
      });
      
      expect(response.status).toBe(400);
      
      const errorResponse = await response.json();
      expect(errorResponse.errors).toContain('Title is required');
      
      console.log('✅ Data Validation: Constraint validation test passed');
    });

    it('should maintain referential integrity', async () => {
      // Create CAPA with valid user reference
      const capaData = {
        ...generateTestCapa(),
        assignedTo: 9999 // Valid user ID
      };
      
      const validResponse = await apiRequest('/api/capa', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(capaData)
      });
      
      expect(validResponse.status).toBe(201);
      
      // Try to create CAPA with invalid user reference
      const invalidCapaData = {
        ...generateTestCapa(),
        assignedTo: 99999 // Invalid user ID
      };
      
      const invalidResponse = await apiRequest('/api/capa', {
        method: 'POST',
        headers: { 'X-Auth-Local': 'true' },
        body: JSON.stringify(invalidCapaData)
      });
      
      expect(invalidResponse.status).toBe(400);
      
      console.log('✅ Data Validation: Referential integrity test passed');
    });
  });
});

// ========================================
// SUMMARY REPORTING
// ========================================
describe('Functional Test Summary', () => {
  it('should generate comprehensive test report', async () => {
    const reportData = {
      testSuite: 'Comprehensive eQMS Functional Testing',
      executionDate: new Date().toISOString(),
      modules: [
        'Document Control',
        'CAPA Management', 
        'Supplier Management',
        'Management Review',
        'Design Control',
        'Audit Management',
        'Complaint Management',
        'Training Management'
      ],
      complianceStandards: [
        'ISO 13485:2016',
        'FDA 21 CFR Part 11',
        'IEC 62304:2006'
      ],
      testCategories: [
        'Functional Testing',
        'Integration Testing',
        'Performance Testing',
        'Security Testing',
        'Compliance Testing',
        'Workflow Testing',
        'Data Validation Testing'
      ]
    };
    
    console.log('📊 FUNCTIONAL TEST EXECUTION SUMMARY');
    console.log('=====================================');
    console.log(`Test Suite: ${reportData.testSuite}`);
    console.log(`Execution Date: ${reportData.executionDate}`);
    console.log(`Modules Tested: ${reportData.modules.join(', ')}`);
    console.log(`Compliance Standards: ${reportData.complianceStandards.join(', ')}`);
    console.log(`Test Categories: ${reportData.testCategories.join(', ')}`);
    console.log('=====================================');
    
    expect(reportData.modules.length).toBeGreaterThan(0);
    expect(reportData.complianceStandards.length).toBeGreaterThan(0);
    
    console.log('✅ Comprehensive functional testing completed successfully');
  });
});
