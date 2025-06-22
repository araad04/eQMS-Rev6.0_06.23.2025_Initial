import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import { app } from '@server/index';

const request = supertest(app);

describe('Document Control API Integration', () => {
  let authToken: string;
  let testDocumentId: number;

  beforeEach(async () => {
    // Setup test environment
    authToken = await getTestAuthToken();
  });

  afterEach(async () => {
    // Cleanup test data
    if (testDocumentId) {
      await cleanupTestDocument(testDocumentId);
    }
  });

  describe('Document Lifecycle Management', () => {
    it('should create document with ISO 13485 compliance', async () => {
      const documentData = {
        title: 'Test Quality Manual',
        type: 'quality_manual',
        version: '1.0',
        content: 'Test content for quality manual',
        approvers: [1, 2],
        reviewers: [3, 4],
        effectiveDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request
        .post('/api/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(documentData)
        .expect(201);

      testDocumentId = response.body.id;

      expect(response.body).toMatchObject({
        title: documentData.title,
        type: documentData.type,
        version: documentData.version,
        status: 'draft'
      });

      expect(response.body).toHaveProperty('auditTrail');
      expect(response.body.auditTrail[0]).toMatchObject({
        action: 'created',
        userId: expect.any(Number),
        timestamp: expect.any(String)
      });
    });

    it('should enforce approval workflow for controlled documents', async () => {
      // Create document
      const createResponse = await request
        .post('/api/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Procedure',
          type: 'procedure',
          version: '1.0',
          content: 'Procedure content',
          controlLevel: 'controlled'
        })
        .expect(201);

      testDocumentId = createResponse.body.id;

      // Attempt to approve without proper workflow
      const directApprovalResponse = await request
        .patch(`/api/documents/${testDocumentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'approved' })
        .expect(400);

      expect(directApprovalResponse.body.error).toContain('approval workflow');

      // Submit for review first
      await request
        .patch(`/api/documents/${testDocumentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'review' })
        .expect(200);

      // Then approve
      const approvalResponse = await request
        .patch(`/api/documents/${testDocumentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          status: 'approved',
          approverComment: 'Approved for implementation',
          electronicSignature: true
        })
        .expect(200);

      expect(approvalResponse.body.status).toBe('approved');
      expect(approvalResponse.body).toHaveProperty('electronicSignature');
    });

    it('should maintain version control with change tracking', async () => {
      // Create initial document
      const initialDoc = await request
        .post('/api/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Version Control Test',
          type: 'procedure',
          version: '1.0',
          content: 'Initial content'
        })
        .expect(201);

      testDocumentId = initialDoc.body.id;

      // Create revision
      const revisionResponse = await request
        .post(`/api/documents/${testDocumentId}/revisions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Updated content with improvements',
          changeReason: 'Process improvement based on audit findings',
          majorChange: false
        })
        .expect(201);

      expect(revisionResponse.body.version).toBe('1.1');
      expect(revisionResponse.body.changeHistory).toHaveLength(1);
      expect(revisionResponse.body.changeHistory[0]).toMatchObject({
        fromVersion: '1.0',
        toVersion: '1.1',
        reason: 'Process improvement based on audit findings',
        changeType: 'minor'
      });
    });

    it('should generate compliance reports with audit trails', async () => {
      const reportResponse = await request
        .get('/api/documents/compliance-report')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          includeAuditTrails: true
        })
        .expect(200);

      expect(reportResponse.body).toHaveProperty('summary');
      expect(reportResponse.body).toHaveProperty('documents');
      expect(reportResponse.body).toHaveProperty('auditTrails');
      
      expect(reportResponse.body.summary).toMatchObject({
        totalDocuments: expect.any(Number),
        pendingReviews: expect.any(Number),
        overdueDocuments: expect.any(Number),
        complianceRate: expect.any(Number)
      });
    });
  });

  describe('Access Control and Security', () => {
    it('should enforce role-based document access', async () => {
      const viewerToken = await getTestAuthToken('viewer');
      
      // Viewer should be able to read approved documents
      const readResponse = await request
        .get('/api/documents')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(readResponse.body).toBeInstanceOf(Array);

      // Viewer should not be able to create documents
      const createResponse = await request
        .post('/api/documents')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          title: 'Unauthorized Document',
          type: 'procedure',
          content: 'Test content'
        })
        .expect(403);

      expect(createResponse.body.error).toContain('insufficient permissions');
    });

    it('should log all document access for audit purposes', async () => {
      // Access a document
      const docResponse = await request
        .post('/api/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Audit Test Document',
          type: 'procedure',
          content: 'Test content'
        })
        .expect(201);

      testDocumentId = docResponse.body.id;

      // View the document
      await request
        .get(`/api/documents/${testDocumentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Check audit logs
      const auditResponse = await request
        .get(`/api/documents/${testDocumentId}/audit-trail`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(auditResponse.body).toContainEqual(
        expect.objectContaining({
          action: 'viewed',
          userId: expect.any(Number),
          timestamp: expect.any(String),
          ipAddress: expect.any(String)
        })
      );
    });
  });

  describe('File Upload and Management', () => {
    it('should handle secure file uploads with virus scanning', async () => {
      const testFile = Buffer.from('PDF content simulation');
      
      const uploadResponse = await request
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFile, 'test-document.pdf')
        .field('title', 'Uploaded Test Document')
        .field('type', 'procedure')
        .expect(201);

      testDocumentId = uploadResponse.body.id;

      expect(uploadResponse.body).toMatchObject({
        title: 'Uploaded Test Document',
        type: 'procedure',
        fileName: 'test-document.pdf',
        fileSize: expect.any(Number),
        virusScanStatus: 'clean'
      });
    });

    it('should validate file types and sizes', async () => {
      const oversizedFile = Buffer.alloc(100 * 1024 * 1024); // 100MB
      
      const oversizeResponse = await request
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', oversizedFile, 'large-file.pdf')
        .field('title', 'Large Document')
        .expect(413);

      expect(oversizeResponse.body.error).toContain('file size exceeds limit');

      // Test invalid file type
      const invalidFile = Buffer.from('executable content');
      
      const invalidTypeResponse = await request
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', invalidFile, 'malicious.exe')
        .field('title', 'Invalid Document')
        .expect(400);

      expect(invalidTypeResponse.body.error).toContain('file type not allowed');
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle concurrent document operations safely', async () => {
      // Create test document
      const docResponse = await request
        .post('/api/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Concurrency Test',
          type: 'procedure',
          content: 'Initial content'
        })
        .expect(201);

      testDocumentId = docResponse.body.id;

      // Simulate concurrent updates
      const updatePromises = Array.from({ length: 5 }, (_, i) =>
        request
          .patch(`/api/documents/${testDocumentId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            content: `Updated content ${i + 1}`,
            version: '1.1'
          })
      );

      const results = await Promise.allSettled(updatePromises);
      
      // Only one update should succeed, others should fail with conflict
      const successful = results.filter(r => r.status === 'fulfilled').length;
      expect(successful).toBe(1);
    });

    it('should maintain performance under load', async () => {
      const startTime = Date.now();
      
      // Create multiple documents concurrently
      const createPromises = Array.from({ length: 10 }, (_, i) =>
        request
          .post('/api/documents')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: `Performance Test Document ${i + 1}`,
            type: 'procedure',
            content: `Content for document ${i + 1}`
          })
      );

      const results = await Promise.all(createPromises);
      const endTime = Date.now();
      
      // All requests should succeed
      results.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Performance should be reasonable (less than 5 seconds for 10 documents)
      expect(endTime - startTime).toBeLessThan(5000);

      // Cleanup created documents
      const cleanupPromises = results.map(response =>
        request
          .delete(`/api/documents/${response.body.id}`)
          .set('Authorization', `Bearer ${authToken}`)
      );
      
      await Promise.all(cleanupPromises);
    });
  });
});

// Helper functions
async function getTestAuthToken(role: string = 'admin'): Promise<string> {
  const loginResponse = await request
    .post('/api/auth/login')
    .send({
      username: `test_${role}`,
      password: 'test_password_123'
    });
  
  return loginResponse.body.token;
}

async function cleanupTestDocument(documentId: number): Promise<void> {
  try {
    await request
      .delete(`/api/documents/${documentId}`)
      .set('Authorization', `Bearer ${await getTestAuthToken()}`);
  } catch (error) {
    console.warn('Failed to cleanup test document:', error);
  }
}