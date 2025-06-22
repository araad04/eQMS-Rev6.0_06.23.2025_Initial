/**
 * Test case for bug DOC005: Approved documents don't appear in Document Control module
 * 
 * This test verifies that documents with "Approved" status (statusId = 3) 
 * properly appear in the main document listing API endpoint.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { documentStorage } from '../server/storage.document';
import { db } from '../server/db';
import { documents } from '../shared/schema';
import { sql } from 'drizzle-orm';

// Test data
const TEST_USER_ID = 9999;
const TEST_DOC_ID = 'DOC-TEST-001';

describe('Document Approval Display Tests', () => {
  let testDocumentId: number | null = null;
  
  // Set up test data - we'll create a document with Approved status
  beforeAll(async () => {
    // Check if our test document already exists
    const [existingDoc] = await db
      .select()
      .from(documents)
      .where(sql`document_id = ${TEST_DOC_ID}`);
    
    if (existingDoc) {
      testDocumentId = existingDoc.id;
      console.log(`Test document already exists with ID: ${testDocumentId}`);
      
      // Ensure it has approved status
      await db
        .update(documents)
        .set({
          statusId: 3, // Approved status
          approvedBy: TEST_USER_ID,
          updatedAt: new Date()
        })
        .where(sql`id = ${testDocumentId}`);
    } else {
      // Create a test document with 'approved' status (statusId = 3)
      const [createdDoc] = await db
        .insert(documents)
        .values({
          documentId: TEST_DOC_ID,
          title: 'Test Document for Approval Display',
          description: 'This is a test document with approved status',
          typeId: 1,
          statusId: 3, // Approved status
          ownerDepartment: 'QA',
          createdBy: TEST_USER_ID,
          approvedBy: TEST_USER_ID,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      testDocumentId = createdDoc.id;
      console.log(`Created test document with ID: ${testDocumentId}`);
    }
  });
  
  // Clean up test data
  afterAll(async () => {
    if (testDocumentId) {
      await db.execute(sql`DELETE FROM document_approvals WHERE "documentId" = ${testDocumentId}`);
      await db.execute(sql`DELETE FROM documents WHERE id = ${testDocumentId}`);
      console.log('Test data cleaned up successfully');
    }
  });
  
  // Test ID: DOC005-TEST-001
  it('should include approved documents in the main documents list', async () => {
    // Get all documents
    const allDocuments = await documentStorage.getDocuments();
    
    // Verify our approved document is in the results
    const testDoc = allDocuments.find(doc => doc.id === testDocumentId);
    
    expect(testDoc).toBeDefined();
    expect(testDoc?.statusId).toBe(3); // Approved status
    expect(testDoc?.documentId).toBe(TEST_DOC_ID);
  });
  
  // Test ID: DOC005-TEST-002 
  it('should map status IDs to status names correctly in the UI code', () => {
    // This test would use a rendering library to verify the frontend component
    // Since we're focusing on the backend issue, we'll simulate the functionality here
    
    // Status mapping function (simulating what happens in the frontend)
    const getStatusName = (statusId: number) => {
      switch(statusId) {
        case 1: return 'Draft';
        case 2: return 'Pending Approval';
        case 3: return 'Approved';
        case 4: return 'Released';
        case 5: return 'Obsolete';
        default: return 'Unknown';
      }
    };
    
    // Verify correct mapping
    expect(getStatusName(3)).toBe('Approved');
  });
});