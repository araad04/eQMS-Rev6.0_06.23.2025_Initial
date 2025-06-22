/**
 * Document Control Module Test Suite
 * Compliant with IEC 62304:2006+AMD1:2015 and 21 CFR Part 11
 * 
 * These tests verify the critical functionality of the document control module:
 * 1. Retrieving pending documents waiting for approval
 * 2. Testing the document approval workflow
 * 3. Ensuring approved documents are properly displayed
 * 
 * Test IDs: TEST-DOC-CTL-001 through TEST-DOC-CTL-003
 * Version: 1.0.0
 * Last Updated: 2025-05-17
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { documentStorage } from '../storage.document';
import { db } from '../db';
import { documents, documentApprovals } from '../../shared/schema';
import { sql } from 'drizzle-orm';

// Test data for document control module tests
let testDocumentId: number | null = null;
let testDocumentIdStr: string = 'DOC-TEST-001';
let testUserId: number = 9999; // Test user ID

// Setup and teardown
beforeAll(async () => {
  // Create a test document in 'pending' status (statusId = 2)
  try {
    const [createdDoc] = await db.insert(documents).values({
      documentId: testDocumentIdStr,
      title: 'Test Document for Approval',
      description: 'This is a test document for the document approval workflow',
      typeId: 1, // SOP
      statusId: 2, // Pending
      ownerDepartment: 'QA',
      createdBy: testUserId,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    testDocumentId = createdDoc.id;
    console.log(`Created test document with ID: ${testDocumentId}`);
  } catch (error) {
    console.error('Error creating test data:', error);
    throw error;
  }
});

afterAll(async () => {
  // Clean up test data
  if (testDocumentId) {
    await db.execute(sql`DELETE FROM document_approvals WHERE "documentId" = ${testDocumentId}`);
    await db.execute(sql`DELETE FROM documents WHERE id = ${testDocumentId}`);
    console.log('Test data cleaned up successfully');
  }
});

// Clear test approvals before each test
beforeEach(async () => {
  if (testDocumentId) {
    await db.execute(sql`DELETE FROM document_approvals WHERE "documentId" = ${testDocumentId}`);
  }
});

describe('Document Control Module Tests', () => {
  // Test ID: TEST-DOC-CTL-001
  it('should retrieve documents with pending approval status', async () => {
    // Get pending documents
    const pendingDocs = await documentStorage.getPendingDocuments();
    
    // Verify test document is in pending list
    expect(pendingDocs.length).toBeGreaterThan(0);
    
    // Find our test document in the results
    const testDoc = pendingDocs.find(doc => doc.id === testDocumentId);
    expect(testDoc).toBeDefined();
    expect(testDoc?.statusId).toBe(2); // Pending status
    expect(testDoc?.documentId).toBe(testDocumentIdStr);
  });
  
  // Test ID: TEST-DOC-CTL-002
  it('should successfully process document approval workflow', async () => {
    if (!testDocumentId) throw new Error('Test document not created');
    
    // Create a document approval record
    const approval = await documentStorage.createDocumentApproval({
      documentId: testDocumentId,
      documentType: 'document',
      userId: testUserId,
      status: 'approved',
      comments: 'Approved in test',
      signatureDate: new Date(),
    });
    
    // Verify approval was created
    expect(approval).toBeDefined();
    expect(approval.documentId).toBe(testDocumentId);
    expect(approval.status).toBe('approved');
    
    // Update document status to approved
    const updatedDoc = await documentStorage.updateDocumentStatus(
      testDocumentId,
      'document',
      'approved',
      testUserId
    );
    
    // Verify document status was updated
    expect(updatedDoc).toBeDefined();
    expect(updatedDoc?.statusId).toBe(3); // Approved status
  });
  
  // Test ID: TEST-DOC-CTL-003
  it('should retrieve approved documents in main document listing', async () => {
    if (!testDocumentId) throw new Error('Test document not created');
    
    // Update document status to approved if not already
    await documentStorage.updateDocumentStatus(
      testDocumentId,
      'document',
      'approved',
      testUserId
    );
    
    // Get all documents
    const allDocs = await documentStorage.getDocuments();
    
    // Verify test document is in the results with approved status
    const testDoc = allDocs.find(doc => doc.id === testDocumentId);
    expect(testDoc).toBeDefined();
    expect(testDoc?.statusId).toBe(3); // Approved status
    expect(testDoc?.documentId).toBe(testDocumentIdStr);
  });
});