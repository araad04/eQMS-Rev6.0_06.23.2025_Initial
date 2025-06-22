import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { 
  managementReviews, 
  managementReviewInputs, 
  managementReviewActionItems, 
  managementReviewSignatures,
  managementReviewAttendees,
  capas,
  capaActions,
  capaEvidence,
  capaVerifications,
  capaCommunications,
  capaRootCauses,
  capaRootCauseContributors,
  capaRootCauseActionMap,
  capaEffectivenessReviews,
  capaClosures,
  capaWorkflows,
  capaWorkflowHistory,
  capaCorrections,
  audits,
  auditChecklistItems,
  nonconformingProducts,
  nonconformingProductAttachments,
  complaints,
  customerFeedback,
  calibrationAssets,
  calibrationRecords
} from "@shared/schema";

export class QMSDeleteOperations {
  
  // Management Review Delete Operations
  async deleteManagementReview(id: number): Promise<boolean> {
    try {
      // Delete related records in order due to foreign key constraints
      // Only delete from tables that exist in the database
      await db.delete(managementReviewSignatures).where(eq(managementReviewSignatures.review_id, id));
      await db.delete(managementReviewActionItems).where(eq(managementReviewActionItems.review_id, id));
      await db.delete(managementReviewInputs).where(eq(managementReviewInputs.review_id, id));
      
      const result = await db.delete(managementReviews).where(eq(managementReviews.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting management review:", error);
      return false;
    }
  }

  // CAPA Delete Operations
  async deleteCapa(id: number): Promise<boolean> {
    try {
      // Delete all related CAPA records in dependency order
      await db.delete(capaRootCauseActionMap).where(
        eq(capaRootCauseActionMap.rootCauseId, 
          db.select({ id: capaRootCauses.id })
            .from(capaRootCauses)
            .where(eq(capaRootCauses.capaId, id))
        )
      );
      
      await db.delete(capaRootCauseContributors).where(
        eq(capaRootCauseContributors.rootCauseId,
          db.select({ id: capaRootCauses.id })
            .from(capaRootCauses)
            .where(eq(capaRootCauses.capaId, id))
        )
      );
      
      await db.delete(capaEvidence).where(eq(capaEvidence.capaId, id));
      await db.delete(capaVerifications).where(
        eq(capaVerifications.actionId,
          db.select({ id: capaActions.id })
            .from(capaActions)
            .where(eq(capaActions.capaId, id))
        )
      );
      
      await db.delete(capaCommunications).where(eq(capaCommunications.capaId, id));
      await db.delete(capaEffectivenessReviews).where(eq(capaEffectivenessReviews.capaId, id));
      await db.delete(capaClosures).where(eq(capaClosures.capaId, id));
      await db.delete(capaWorkflowHistory).where(
        eq(capaWorkflowHistory.workflowId,
          db.select({ id: capaWorkflows.id })
            .from(capaWorkflows)
            .where(eq(capaWorkflows.capaId, id))
        )
      );
      
      await db.delete(capaWorkflows).where(eq(capaWorkflows.capaId, id));
      await db.delete(capaCorrections).where(eq(capaCorrections.capaId, id));
      await db.delete(capaActions).where(eq(capaActions.capaId, id));
      await db.delete(capaRootCauses).where(eq(capaRootCauses.capaId, id));
      
      const result = await db.delete(capas).where(eq(capas.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting CAPA:", error);
      return false;
    }
  }

  // Audit Delete Operations
  async deleteAudit(id: number): Promise<boolean> {
    try {
      // Delete audit checklist items first
      await db.delete(auditChecklistItems).where(eq(auditChecklistItems.auditId, id));
      
      const result = await db.delete(audits).where(eq(audits.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting audit:", error);
      return false;
    }
  }

  // Nonconforming Product Delete Operations
  async deleteNonconformingProduct(id: number): Promise<boolean> {
    try {
      // Delete attachments first
      await db.delete(nonconformingProductAttachments).where(eq(nonconformingProductAttachments.productId, id));
      
      const result = await db.delete(nonconformingProducts).where(eq(nonconformingProducts.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting nonconforming product:", error);
      return false;
    }
  }

  // Complaint Delete Operations
  async deleteComplaint(id: number): Promise<boolean> {
    try {
      const result = await db.delete(complaints).where(eq(complaints.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting complaint:", error);
      return false;
    }
  }

  // Customer Feedback Delete Operations
  async deleteCustomerFeedback(id: number): Promise<boolean> {
    try {
      const result = await db.delete(customerFeedback).where(eq(customerFeedback.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting customer feedback:", error);
      return false;
    }
  }

  // Calibration Asset Delete Operations
  async deleteCalibrationAsset(id: number): Promise<boolean> {
    try {
      // Delete calibration records first
      await db.delete(calibrationRecords).where(eq(calibrationRecords.assetId, id));
      
      const result = await db.delete(calibrationAssets).where(eq(calibrationAssets.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting calibration asset:", error);
      return false;
    }
  }

  // Calibration Record Delete Operations
  async deleteCalibrationRecord(id: number): Promise<boolean> {
    try {
      const result = await db.delete(calibrationRecords).where(eq(calibrationRecords.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting calibration record:", error);
      return false;
    }
  }
}

export const qmsDeleteOperations = new QMSDeleteOperations();