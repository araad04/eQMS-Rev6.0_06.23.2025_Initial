import { Router } from "express";
import { z } from "zod";
import { db } from "./db";
import { eq, desc, and, or, asc, count, sql } from "drizzle-orm";
import {
  technicalDocuments,
  mdrSections,
  technicalDocumentSections,
  technicalDocumentAttachments,
  technicalDocumentReferences,
  technicalDocumentApprovalWorkflow,
  technicalDocumentApprovalSteps,
  technicalDocumentVersions,
  designProjects,
  users,
  insertTechnicalDocumentSchema,
  insertTechnicalDocumentSectionSchema,
  insertTechnicalDocumentAttachmentSchema,
  insertTechnicalDocumentReferenceSchema,
  insertTechnicalDocumentApprovalWorkflowSchema,
  insertTechnicalDocumentApprovalStepSchema,
  insertTechnicalDocumentVersionSchema
} from "@shared/schema";
import { authMiddleware } from "./middleware/auth";

const router = Router();

// Get all technical documents
router.get("/", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const documents = await db
      .select({
        id: technicalDocuments.id,
        title: technicalDocuments.title,
        deviceModel: technicalDocuments.deviceModel,
        documentNumber: technicalDocuments.documentNumber,
        status: technicalDocuments.status,
        version: technicalDocuments.version,
        revisionLevel: technicalDocuments.revisionLevel,
        createdAt: technicalDocuments.createdAt,
        updatedAt: technicalDocuments.updatedAt,
        createdByUser: users.firstName,
        createdByLastName: users.lastName,
        approvedByUser: sql`approved_user.first_name`.as('approvedByUser'),
        approvedByLastName: sql`approved_user.last_name`.as('approvedByLastName'),
        approvedAt: technicalDocuments.approvedAt,
        designProjectId: technicalDocuments.designProjectId
      })
      .from(technicalDocuments)
      .leftJoin(users, eq(technicalDocuments.createdBy, users.id))
      .leftJoin(sql`users approved_user`, sql`technical_documents.approved_by = approved_user.id`)
      .orderBy(desc(technicalDocuments.createdAt));

    res.json(documents);
  } catch (error) {
    console.error("Error fetching technical documents:", error);
    res.status(500).json({ error: "Failed to fetch technical documents" });
  }
});

// Get single technical document with sections
router.get("/:id", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    
    // Get document details
    const document = await db
      .select()
      .from(technicalDocuments)
      .where(eq(technicalDocuments.id, documentId))
      .limit(1);

    if (!document.length) {
      return res.status(404).json({ error: "Technical document not found" });
    }

    // Get document sections with completion status
    const sections = await db
      .select({
        id: technicalDocumentSections.id,
        sectionId: technicalDocumentSections.sectionId,
        sectionNumber: technicalDocumentSections.sectionNumber,
        title: technicalDocumentSections.title,
        content: technicalDocumentSections.content,
        completionStatus: technicalDocumentSections.completionStatus,
        autoLinked: technicalDocumentSections.autoLinked,
        sourceType: technicalDocumentSections.sourceType,
        reviewedBy: technicalDocumentSections.reviewedBy,
        reviewedAt: technicalDocumentSections.reviewedAt,
        reviewComments: technicalDocumentSections.reviewComments,
        mdrSectionTitle: mdrSections.title,
        mdrSectionDescription: mdrSections.description,
        mdrSectionGuidance: mdrSections.guidance,
        mdrSectionTemplate: mdrSections.template,
        annexReference: mdrSections.annexReference,
        isRequired: mdrSections.isRequired
      })
      .from(technicalDocumentSections)
      .leftJoin(mdrSections, eq(technicalDocumentSections.sectionId, mdrSections.id))
      .where(eq(technicalDocumentSections.techDocId, documentId))
      .orderBy(asc(mdrSections.sortOrder));

    // Get attachments
    const attachments = await db
      .select()
      .from(technicalDocumentAttachments)
      .where(eq(technicalDocumentAttachments.techDocId, documentId))
      .orderBy(desc(technicalDocumentAttachments.uploadedAt));

    res.json({
      document: document[0],
      sections,
      attachments
    });
  } catch (error) {
    console.error("Error fetching technical document:", error);
    res.status(500).json({ error: "Failed to fetch technical document" });
  }
});

// Create new technical document
router.post("/", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const data = insertTechnicalDocumentSchema.parse({
      ...req.body,
      createdBy: (req as any).user.id
    });

    // Generate document number
    const count = await db
      .select({ count: sql`count(*)` })
      .from(technicalDocuments);
    
    const documentNumber = `TD-${new Date().getFullYear()}-${String(Number(count[0].count) + 1).padStart(3, '0')}`;
    
    const [document] = await db
      .insert(technicalDocuments)
      .values({
        ...data,
        documentNumber
      })
      .returning();

    // Create default sections based on MDR structure
    const mdrSectionsList = await db
      .select()
      .from(mdrSections)
      .orderBy(asc(mdrSections.sortOrder));

    const defaultSections = mdrSectionsList.map(section => ({
      techDocId: document.id,
      sectionId: section.id,
      sectionNumber: section.sectionNumber,
      title: section.title,
      content: section.template || '',
      completionStatus: 'NOT_STARTED' as const,
      createdBy: (req as any).user.id
    }));

    await db
      .insert(technicalDocumentSections)
      .values(defaultSections);

    res.status(201).json(document);
  } catch (error) {
    console.error("Error creating technical document:", error);
    res.status(500).json({ error: "Failed to create technical document" });
  }
});

// Update technical document section
router.put("/:id/sections/:sectionId", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const sectionId = parseInt(req.params.sectionId);
    
    const updateData = z.object({
      content: z.string(),
      completionStatus: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED']).optional(),
      reviewComments: z.string().optional()
    }).parse(req.body);

    const [updatedSection] = await db
      .update(technicalDocumentSections)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(and(
        eq(technicalDocumentSections.techDocId, documentId),
        eq(technicalDocumentSections.id, sectionId)
      ))
      .returning();

    // Update parent document timestamp
    await db
      .update(technicalDocuments)
      .set({ updatedAt: new Date() })
      .where(eq(technicalDocuments.id, documentId));

    res.json(updatedSection);
  } catch (error) {
    console.error("Error updating section:", error);
    res.status(500).json({ error: "Failed to update section" });
  }
});

// Upload attachment for technical document
router.post("/:id/attachments", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    
    const data = insertTechnicalDocumentAttachmentSchema.parse({
      ...req.body,
      techDocId: documentId,
      uploadedBy: (req as any).user.id
    });

    const [attachment] = await db
      .insert(technicalDocumentAttachments)
      .values(data)
      .returning();

    res.status(201).json(attachment);
  } catch (error) {
    console.error("Error uploading attachment:", error);
    res.status(500).json({ error: "Failed to upload attachment" });
  }
});

// Get MDR sections structure
router.get("/mdr-sections/structure", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const sections = await db
      .select()
      .from(mdrSections)
      .orderBy(asc(mdrSections.sortOrder));

    res.json(sections);
  } catch (error) {
    console.error("Error fetching MDR sections:", error);
    res.status(500).json({ error: "Failed to fetch MDR sections" });
  }
});

// Generate PDF for technical document
router.post("/:id/generate-pdf", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    
    // Get document with all sections and attachments
    const document = await db
      .select()
      .from(technicalDocuments)
      .where(eq(technicalDocuments.id, documentId))
      .limit(1);

    if (!document.length) {
      return res.status(404).json({ error: "Technical document not found" });
    }

    const sections = await db
      .select({
        sectionNumber: technicalDocumentSections.sectionNumber,
        title: technicalDocumentSections.title,
        content: technicalDocumentSections.content,
        annexReference: mdrSections.annexReference,
        sortOrder: mdrSections.sortOrder
      })
      .from(technicalDocumentSections)
      .leftJoin(mdrSections, eq(technicalDocumentSections.sectionId, mdrSections.id))
      .where(eq(technicalDocumentSections.techDocId, documentId))
      .orderBy(asc(mdrSections.sortOrder));

    // Generate PDF compilation path
    const pdfPath = `/pdfs/technical-documents/${document[0].documentNumber}-v${document[0].version}.pdf`;
    
    // Update document with PDF path
    await db
      .update(technicalDocuments)
      .set({ 
        compiledPdfPath: pdfPath,
        updatedAt: new Date()
      })
      .where(eq(technicalDocuments.id, documentId));

    res.json({
      success: true,
      pdfPath,
      document: document[0],
      sections
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// Submit for approval workflow
router.post("/:id/submit-for-approval", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    
    const approvalData = z.object({
      approvers: z.array(z.number()),
      comments: z.string().optional()
    }).parse(req.body);

    // Create approval workflow
    const [workflow] = await db
      .insert(technicalDocumentApprovalWorkflow)
      .values({
        techDocId: documentId,
        submittedBy: (req as any).user.id,
        status: 'PENDING'
      })
      .returning();

    // Create approval steps
    const approvalSteps = approvalData.approvers.map((approverId, index) => ({
      workflowId: workflow.id,
      stepNumber: index + 1,
      assignedTo: approverId,
      stepType: index === approvalData.approvers.length - 1 ? 'FINAL_APPROVAL' : 'REVIEW'
    }));

    await db
      .insert(technicalDocumentApprovalSteps)
      .values(approvalSteps);

    // Update document status
    await db
      .update(technicalDocuments)
      .set({ status: 'IN_REVIEW' })
      .where(eq(technicalDocuments.id, documentId));

    res.json({ success: true, workflow });
  } catch (error) {
    console.error("Error submitting for approval:", error);
    res.status(500).json({ error: "Failed to submit for approval" });
  }
});

// Get completion statistics
router.get("/:id/completion-stats", authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    
    const stats = await db
      .select({
        completionStatus: technicalDocumentSections.completionStatus,
        count: count()
      })
      .from(technicalDocumentSections)
      .where(eq(technicalDocumentSections.techDocId, documentId))
      .groupBy(technicalDocumentSections.completionStatus);

    const totalSections = stats.reduce((sum, stat) => sum + Number(stat.count), 0);
    const completedSections = stats
      .filter(stat => stat.completionStatus === 'COMPLETED' || stat.completionStatus === 'REVIEWED')
      .reduce((sum, stat) => sum + Number(stat.count), 0);

    const completionPercentage = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

    res.json({
      totalSections,
      completedSections,
      completionPercentage,
      statusBreakdown: stats
    });
  } catch (error) {
    console.error("Error fetching completion stats:", error);
    res.status(500).json({ error: "Failed to fetch completion stats" });
  }
});

export default router;