/**
 * 21 CFR Part 11 Electronic Signature Implementation
 * FDA Electronic Records; Electronic Signatures Compliance
 * For eQMS Platform Backend Systems
 */

import { Request, Response } from 'express';
import { db } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { createHash, createHmac } from 'crypto';
import { z } from 'zod';

// Electronic Signature Schema
export const electronicSignatureSchema = z.object({
  documentId: z.number(),
  userId: z.number(),
  signatureReason: z.enum(['approve', 'review', 'acknowledge', 'authorize']),
  signatureText: z.string().min(1),
  password: z.string().min(8), // Re-authentication required per CFR Part 11
  timestamp: z.date(),
  location: z.string().optional(),
  ipAddress: z.string()
});

export type ElectronicSignature = z.infer<typeof electronicSignatureSchema>;

// Digital signature verification schema
export const signatureVerificationSchema = z.object({
  signatureId: z.number(),
  originalDocument: z.string(),
  signedDocument: z.string(),
  verificationMethod: z.enum(['hash', 'hmac', 'digital_certificate'])
});

/**
 * CFR Part 11 Electronic Signature Service
 * Implements secure electronic signatures for regulatory documents
 */
export class CFRPart11SignatureService {
  private static readonly SIGNATURE_SECRET = process.env.SIGNATURE_SECRET || 'cfr-part-11-secret';
  private static readonly SIGNATURE_ALGORITHM = 'sha256';

  /**
   * Create electronic signature with CFR Part 11 compliance
   * Requirements: User authentication, audit trail, data integrity
   */
  static async createElectronicSignature(
    signatureData: ElectronicSignature,
    req: Request
  ): Promise<{ signatureId: number; documentHash: string }> {
    
    // Step 1: Validate user re-authentication (CFR Part 11.200)
    const isUserAuthenticated = await this.validateUserAuthentication(
      signatureData.userId, 
      signatureData.password
    );
    
    if (!isUserAuthenticated) {
      throw new Error('CFR Part 11 Violation: User re-authentication failed');
    }

    // Step 2: Get current document state
    const document = await this.getDocumentForSigning(signatureData.documentId);
    if (!document) {
      throw new Error('Document not found for electronic signature');
    }

    // Step 3: Create document hash for integrity verification
    const documentHash = this.createDocumentHash(document);
    
    // Step 4: Generate unique signature identifier
    const signatureId = await this.generateSignatureId();

    return await db.transaction(async (tx) => {
      // Step 5: Create electronic signature record
      const [electronicSig] = await tx.insert(electronicSignatures).values({
        id: signatureId,
        documentId: signatureData.documentId,
        userId: signatureData.userId,
        signatureReason: signatureData.signatureReason,
        signatureText: signatureData.signatureText,
        documentHash,
        signatureHash: this.createSignatureHash(signatureData, documentHash),
        timestamp: new Date(),
        ipAddress: req.ip || 'unknown',
        location: signatureData.location || 'system',
        isValid: true,
        verificationMethod: 'hmac'
      }).returning();

      // Step 6: Create immutable audit trail (CFR Part 11.10)
      await tx.insert(cfrAuditTrail).values({
        entityType: 'electronic_signature',
        entityId: electronicSig.id,
        action: 'signature_created',
        userId: signatureData.userId,
        timestamp: new Date(),
        details: JSON.stringify({
          documentId: signatureData.documentId,
          signatureReason: signatureData.signatureReason,
          documentHash,
          regulatoryCompliance: 'CFR_PART_11'
        }),
        ipAddress: req.ip,
        sessionId: req.sessionID || 'unknown'
      });

      // Step 7: Update document status if approval signature
      if (signatureData.signatureReason === 'approve') {
        await tx.update(documents)
          .set({ 
            statusId: 3, // Approved status
            approvedBy: signatureData.userId,
            approvedAt: new Date(),
            electronicSignatureId: electronicSig.id
          })
          .where(eq(documents.id, signatureData.documentId));
      }

      console.log(`✅ CFR Part 11 Electronic Signature Created: ${signatureId}`);
      return { signatureId: electronicSig.id, documentHash };
    });
  }

  /**
   * Verify electronic signature integrity (CFR Part 11.70)
   */
  static async verifyElectronicSignature(signatureId: number): Promise<{
    isValid: boolean;
    integrityCheck: boolean;
    details: any;
  }> {
    const signature = await db.select()
      .from(electronicSignatures)
      .where(eq(electronicSignatures.id, signatureId))
      .limit(1);

    if (signature.length === 0) {
      return { isValid: false, integrityCheck: false, details: 'Signature not found' };
    }

    const sig = signature[0];

    // Step 1: Verify document integrity
    const currentDocument = await this.getDocumentForSigning(sig.documentId);
    const currentHash = this.createDocumentHash(currentDocument);
    const integrityCheck = currentHash === sig.documentHash;

    // Step 2: Verify signature hash
    const expectedSignatureHash = this.createSignatureHash({
      documentId: sig.documentId,
      userId: sig.userId,
      signatureReason: sig.signatureReason as any,
      signatureText: sig.signatureText,
      password: '', // Not stored for security
      timestamp: sig.timestamp,
      location: sig.location || '',
      ipAddress: sig.ipAddress
    }, sig.documentHash);

    const signatureValid = expectedSignatureHash === sig.signatureHash;

    return {
      isValid: sig.isValid && signatureValid,
      integrityCheck,
      details: {
        signatureId: sig.id,
        timestamp: sig.timestamp,
        userId: sig.userId,
        documentId: sig.documentId,
        reason: sig.signatureReason,
        verificationMethod: sig.verificationMethod
      }
    };
  }

  /**
   * Generate CFR Part 11 compliance report for signatures
   */
  static async generateSignatureComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalSignatures: number;
    validSignatures: number;
    integrityViolations: number;
    compliancePercentage: number;
    details: any[];
  }> {
    const signatures = await db.select()
      .from(electronicSignatures)
      .where(
        and(
          gte(electronicSignatures.timestamp, startDate),
          lte(electronicSignatures.timestamp, endDate)
        )
      )
      .orderBy(desc(electronicSignatures.timestamp));

    const verificationResults = await Promise.all(
      signatures.map(sig => this.verifyElectronicSignature(sig.id))
    );

    const totalSignatures = signatures.length;
    const validSignatures = verificationResults.filter(r => r.isValid).length;
    const integrityViolations = verificationResults.filter(r => !r.integrityCheck).length;
    const compliancePercentage = totalSignatures > 0 ? 
      Math.round((validSignatures / totalSignatures) * 100) : 100;

    return {
      totalSignatures,
      validSignatures,
      integrityViolations,
      compliancePercentage,
      details: verificationResults.map((result, index) => ({
        signatureId: signatures[index].id,
        documentId: signatures[index].documentId,
        userId: signatures[index].userId,
        timestamp: signatures[index].timestamp,
        isValid: result.isValid,
        integrityCheck: result.integrityCheck
      }))
    };
  }

  // Private helper methods
  private static async validateUserAuthentication(userId: number, password: string): Promise<boolean> {
    try {
      // Re-authenticate user for CFR Part 11 compliance
      const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) return false;

      // Verify password (implementation depends on your auth system)
      const bcrypt = await import('bcrypt');
      return await bcrypt.compare(password, user[0].password);
    } catch {
      return false;
    }
  }

  private static async getDocumentForSigning(documentId: number): Promise<any> {
    const document = await db.select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);
    
    return document[0] || null;
  }

  private static createDocumentHash(document: any): string {
    const documentString = JSON.stringify({
      id: document.id,
      title: document.title,
      content: document.content,
      version: document.version,
      createdAt: document.createdAt
    });
    
    return createHash(this.SIGNATURE_ALGORITHM)
      .update(documentString)
      .digest('hex');
  }

  private static createSignatureHash(signature: ElectronicSignature, documentHash: string): string {
    const signatureString = JSON.stringify({
      documentId: signature.documentId,
      userId: signature.userId,
      signatureReason: signature.signatureReason,
      signatureText: signature.signatureText,
      documentHash,
      timestamp: signature.timestamp.toISOString()
    });

    return createHmac(this.SIGNATURE_ALGORITHM, this.SIGNATURE_SECRET)
      .update(signatureString)
      .digest('hex');
  }

  private static async generateSignatureId(): Promise<number> {
    // Generate unique signature ID
    return Date.now() + Math.floor(Math.random() * 1000);
  }
}

/**
 * CFR Part 11 Middleware for protecting regulated endpoints
 */
export function requireElectronicSignature(signatureReason: string) {
  return async (req: Request, res: Response, next: any) => {
    const { documentId, electronicSignature } = req.body;

    if (!electronicSignature) {
      return res.status(400).json({
        error: 'CFR Part 11 Violation',
        message: 'Electronic signature required for this operation',
        code: 'ELECTRONIC_SIGNATURE_REQUIRED'
      });
    }

    try {
      // Validate electronic signature
      const signatureData = electronicSignatureSchema.parse({
        ...electronicSignature,
        documentId,
        signatureReason,
        timestamp: new Date(),
        ipAddress: req.ip || 'unknown'
      });

      // Create electronic signature
      const result = await CFRPart11SignatureService.createElectronicSignature(
        signatureData,
        req
      );

      // Attach signature info to request for downstream processing
      req.electronicSignature = result;
      next();
    } catch (error) {
      console.error('CFR Part 11 Electronic Signature Error:', error);
      return res.status(400).json({
        error: 'Electronic signature validation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'ELECTRONIC_SIGNATURE_INVALID'
      });
    }
  };
}

// Export for use in routes
export { CFRPart11SignatureService as ElectronicSignatureService };