import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { Logger } from "./utils/logger";
import {
  documents,
  documentVersions,
  documentApprovals,
  InsertDocument,
  InsertDocumentVersion,
  InsertDocumentApproval,
  Document,
  DocumentVersion,
  DocumentApproval
} from "@shared/schema";

/**
 * Document Storage Service
 * Handles persistence operations for document control and approval workflows
 * Supporting 21 CFR Part 11 compliance for document approval processes
 */
export class DocumentStorage {
  /**
   * Get a document by ID
   * @param id Document ID
   * @returns Document or undefined if not found
   */
  async getDocument(id: number): Promise<Document | undefined> {
    try {
      console.log(`DocumentStorage.getDocument: Looking for document ID ${id}`);
      
      const result = await db
        .select()
        .from(documents)
        .where(eq(documents.id, id));
      
      console.log(`DocumentStorage.getDocument: Query result:`, result);
      console.log(`DocumentStorage.getDocument: Found ${result.length} documents`);
      
      const [document] = result;
      console.log(`DocumentStorage.getDocument: Returning document:`, document);
      
      return document;
    } catch (error) {
      console.error(`DocumentStorage.getDocument: Error getting document ${id}:`, error);
      Logger.error(`Error getting document ${id}: ${error.message}`);
      return undefined;
    }
  }

  /**
   * Get a document version by ID
   * @param id Document version ID
   * @returns Document version or undefined if not found
   */
  async getDocumentVersion(id: number): Promise<DocumentVersion | undefined> {
    try {
      const [version] = await db
        .select()
        .from(documentVersions)
        .where(eq(documentVersions.id, id));
      
      return version;
    } catch (error) {
      Logger.error(`Error getting document version ${id}: ${error.message}`);
      return undefined;
    }
  }

  /**
   * Get document versions by document ID
   * @param documentId Document ID
   * @returns Array of document versions
   */
  async getDocumentVersions(documentId: number): Promise<DocumentVersion[]> {
    try {
      const versions = await db
        .select()
        .from(documentVersions)
        .where(eq(documentVersions.documentId, documentId))
        .orderBy(desc(documentVersions.versionNumber));
      
      return versions;
    } catch (error) {
      Logger.error(`Error getting document versions for document ${documentId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Get document approvals by document ID and type
   * @param documentId Document ID
   * @param documentType Document type (document, sop, etc.)
   * @returns Array of document approvals
   */
  async getDocumentApprovals(documentId: number, documentType: string): Promise<DocumentApproval[]> {
    try {
      const approvals = await db
        .select()
        .from(documentApprovals)
        .where(and(
          eq(documentApprovals.documentId, documentId),
          eq(documentApprovals.documentType, documentType)
        ))
        .orderBy(desc(documentApprovals.signatureDate));
      
      return approvals;
    } catch (error) {
      Logger.error(`Error getting document approvals for document ${documentId}: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Get all documents with optional filtering
   * @returns Array of documents
   */
  async getDocuments(): Promise<Document[]> {
    try {
      const allDocuments = await db
        .select()
        .from(documents)
        .orderBy(desc(documents.createdAt));
      
      return allDocuments;
    } catch (error) {
      Logger.error(`Error getting documents: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Get documents pending approval
   * @returns Array of documents with pending approval status
   */
  async getPendingDocuments(): Promise<Document[]> {
    try {
      const pendingDocuments = await db
        .select()
        .from(documents)
        .where(eq(documents.statusId, 2)) // StatusId 2 corresponds to 'pending'
        .orderBy(desc(documents.createdAt));
      
      return pendingDocuments;
    } catch (error) {
      Logger.error(`Error getting pending documents: ${error.message}`);
      return [];
    }
  }

  /**
   * Create a new document
   * @param document Document data to insert
   * @returns Created document
   */
  async createDocument(document: InsertDocument): Promise<Document> {
    try {
      const [createdDocument] = await db
        .insert(documents)
        .values(document)
        .returning();
      
      return createdDocument;
    } catch (error) {
      Logger.error(`Error creating document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new document version
   * @param version Document version data to insert
   * @returns Created document version
   */
  async createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion> {
    try {
      const [createdVersion] = await db
        .insert(documentVersions)
        .values(version)
        .returning();
      
      return createdVersion;
    } catch (error) {
      Logger.error(`Error creating document version: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a document approval record
   * For 21 CFR Part 11 compliance, this includes electronic signature data
   * @param approval Document approval data to insert
   * @returns Created document approval record
   */
  async createDocumentApproval(approval: InsertDocumentApproval): Promise<DocumentApproval> {
    try {
      const [createdApproval] = await db
        .insert(documentApprovals)
        .values(approval)
        .returning();
      
      return createdApproval;
    } catch (error) {
      Logger.error(`Error creating document approval: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update document status
   * Used in document approval workflows
   * @param documentId Document ID
   * @param documentType Document type
   * @param status New status
   * @param userId User ID making the change
   * @returns Updated document
   */
  async updateDocumentStatus(
    documentId: number,
    documentType: string,
    status: string,
    userId: number
  ): Promise<Document | undefined> {
    try {
      // Map status string to statusId
      let statusId: number;
      switch (status.toLowerCase()) {
        case 'draft':
          statusId = 1;
          break;
        case 'pending':
          statusId = 2;
          break;
        case 'approved':
          statusId = 3;
          break;
        case 'released':
          statusId = 4;
          break;
        case 'obsolete':
          statusId = 5;
          break;
        default:
          statusId = 1; // Default to draft if status is unknown
      }
      
      // Update the document status based on type
      if (documentType === 'document') {
        const [updatedDocument] = await db
          .update(documents)
          .set({
            statusId,
            updatedAt: new Date(),
            updatedBy: userId
          })
          .where(eq(documents.id, documentId))
          .returning();
        
        return updatedDocument;
      }
      
      // Other document types can be handled here
      
      Logger.error(`Unsupported document type: ${documentType}`);
      return undefined;
    } catch (error) {
      Logger.error(`Error updating document status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a document by ID
   * This will also delete related document versions and approvals
   * @param id Document ID
   * @returns True if deletion was successful, false otherwise
   */
  async deleteDocument(id: number): Promise<boolean> {
    try {
      // Start a transaction to ensure data consistency
      await db.transaction(async (tx) => {
        // Delete document approvals first (foreign key constraint)
        await tx
          .delete(documentApprovals)
          .where(eq(documentApprovals.documentId, id));
        
        // Delete document versions
        await tx
          .delete(documentVersions)
          .where(eq(documentVersions.documentId, id));
        
        // Finally delete the main document
        await tx
          .delete(documents)
          .where(eq(documents.id, id));
      });
      
      Logger.info(`Successfully deleted document ${id} and all related records`);
      return true;
    } catch (error) {
      Logger.error(`Error deleting document ${id}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get a Standard Operating Procedure (SOP) by ID
   * This is a placeholder method for supporting different document types
   * @param id SOP ID
   * @returns SOP document or undefined if not found
   */
  async getSOP(id: number): Promise<Document | undefined> {
    // For now, SOPs are stored in the same table as regular documents
    // In a production environment, they might be in a separate table
    try {
      const [sop] = await db
        .select()
        .from(documents)
        .where(and(
          eq(documents.id, id),
          eq(documents.documentType, 'sop')
        ));
      
      return sop;
    } catch (error) {
      Logger.error(`Error getting SOP ${id}: ${error.message}`);
      return undefined;
    }
  }
}

export const documentStorage = new DocumentStorage();